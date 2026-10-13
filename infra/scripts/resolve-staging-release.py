#!/usr/bin/env python3
"""Resolve an immutable image only when its exact commit passed staging QA."""
import argparse
import json
import re
import subprocess
import sys


def aws_json(*args, region):
    response = subprocess.run(["aws", *args, "--region", region, "--output", "json", "--no-cli-pager"],
                              check=True, capture_output=True, text=True)
    return json.loads(response.stdout)


def resolve_release(sha, repository, registry, region, aws=aws_json):
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("A full commit SHA is required")
    if not re.fullmatch(r"[a-z0-9][a-z0-9._/-]{1,255}", repository):
        raise ValueError("Invalid repository name")
    if not re.fullmatch(r"[a-z]{2}-[a-z]+-[0-9]", region):
        raise ValueError("Invalid region")
    if not re.fullmatch(r"[0-9]{12}\.dkr\.ecr\." + re.escape(region) + r"\.amazonaws\.com", registry):
        raise ValueError("The registry must match the deployment region")
    config = aws("ecr", "describe-repositories", "--repository-names", repository, region=region)
    repos = config.get("repositories", [])
    if len(repos) != 1 or repos[0].get("imageTagMutability") != "IMMUTABLE":
        raise ValueError("Release repository tags must be immutable")
    passed = "staging-passed-" + sha
    response = aws("ecr", "describe-images", "--repository-name", repository,
                   "--image-ids", "imageTag=" + sha, "imageTag=" + passed, region=region)
    digests = {sha: set(), passed: set()}
    for image in response.get("imageDetails", []):
        digest = image.get("imageDigest", "")
        if not re.fullmatch(r"sha256:[0-9a-f]{64}", digest):
            raise ValueError("Invalid image digest")
        for tag in digests:
            if tag in image.get("imageTags", []):
                digests[tag].add(digest)
    if len(digests[sha]) != 1 or len(digests[passed]) != 1 or digests[sha] != digests[passed]:
        raise ValueError("The exact release image has not passed staging QA")
    digest = next(iter(digests[sha]))
    return {"commit": sha, "digest": digest, "image": f"{registry}/{repository}@{digest}"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for argument in ["sha", "repository", "registry", "region"]:
        parser.add_argument("--" + argument, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(resolve_release(args.sha, args.repository, args.registry, args.region)))
    except subprocess.CalledProcessError:
        print("Release metadata unavailable; no deployment was started", file=sys.stderr)
        return 1
    except (ValueError, TypeError, KeyError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
