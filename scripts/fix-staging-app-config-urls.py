#!/usr/bin/env python3
"""Update staging app-config URL fields without rewriting unrelated secret keys."""

from __future__ import annotations

import json
import os
import subprocess
import sys

FRONTEND_URL = os.environ.get(
    "STAGING_FRONTEND_URL",
    "https://develop.d2bcg3vnlv5hkh.amplifyapp.com",
)
SECRET_ID = "herfree/staging/app-config"
PROFILE = "herfree-staging"
REGION = "ap-northeast-2"
REQUIRED_KEYS = (
    "cloudWatchLogGroup",
    "frontendOrigin",
    "jwtSecret",
    "analyticsHashSalt",
    "dbHost",
    "s3Bucket",
    "oauth",
)


def aws(*args: str) -> str:
    result = subprocess.run(
        ["aws", *args, "--profile", PROFILE, "--region", REGION],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def main() -> int:
    raw = aws(
        "secretsmanager",
        "get-secret-value",
        "--secret-id",
        SECRET_ID,
        "--query",
        "SecretString",
        "--output",
        "text",
    )
    try:
        config = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"invalid JSON in {SECRET_ID}: {exc}", file=sys.stderr)
        return 1

    missing = [key for key in REQUIRED_KEYS if key not in config]
    if missing:
        print(f"missing keys in {SECRET_ID}: {', '.join(missing)}", file=sys.stderr)
        return 1

    config["frontendOrigin"] = FRONTEND_URL
    oauth = config.get("oauth") or {}
    for provider in ("kakao", "google", "naver"):
        entry = oauth.get(provider)
        if not isinstance(entry, dict):
            print(f"missing oauth.{provider} object", file=sys.stderr)
            return 1
        entry["redirectUri"] = f"{FRONTEND_URL}/auth/callback/{provider}"

    updated = json.dumps(config, ensure_ascii=False, separators=(",", ":"))
    subprocess.run(
        [
            "aws",
            "secretsmanager",
            "put-secret-value",
            "--profile",
            PROFILE,
            "--region",
            REGION,
            "--secret-id",
            SECRET_ID,
            "--secret-string",
            updated,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    print(f"updated {SECRET_ID} frontendOrigin + oauth redirect URIs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
