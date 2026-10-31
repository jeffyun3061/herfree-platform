# Isolated staging database helper (review only)

`infra/scripts/staging-isolated-db.sh` prepares a new disposable database on the existing staging-only MySQL host without changing the existing staging database. It is not wired into a workflow, is not a promotion gate, and must not be used as production-release evidence on its own.

The caller must ensure the staging EC2 host is the intended isolated host, the external staging test route is protected, the candidate is pinned, and the last known staging image is recoverable. The script restricts container selection to the staging compose project and checks that the running API is healthy and matches the recorded current image, private MySQL networking, one active isolation at a time, a successful staging predeployment backup, and a newly absent `hfqa_<8 hex>` database before changing anything. It journals the original environment and image in a permission-restricted directory. Passwords are not printed.

Three explicit phases are needed:

1. `prepare <run>` creates the isolated DB and schema-scoped grant and switches the staging configuration to it. Only the staging configuration is changed, with the admin IP gate restricted to loopback. The caller must then deploy and test the candidate separately.
2. `restore-config <run>` restores the original staging configuration. It refuses to overwrite a configuration that no longer matches either the saved original or this run's generated test configuration. The caller must then restore the recorded original image using the normal rollback script and verify it is healthy.
3. `finalize <run>` checks the saved configuration, recorded and running image, running datasource, and health before revoking the test schema grant and dropping only the database owned by that run. The state record is removed only after successful cleanup.

Each command takes the existing staging release lock while it executes, but the lock is not held between commands. An orchestrator must serialize the whole multi-step run and keep a durable record outside its runner. It must not promote an image while cleanup or state is uncertain. If a command is interrupted between recording creation intent and confirming creation, the helper refuses automatic deletion and requires manual reconciliation. A runner cancellation, a lost connection, missing state, an unexpected configuration edit, or an unhealthy restored service must not be reported as a clean run.

This helper alone does not resolve the different `main`/`develop` frontend trees, create a protected QA branch, change IAM policy, attach the tested rollback image to production deployment, or verify production backup recovery. Those remain separate work and no staging or production resources should be changed until the complete workflow is reviewed and verified.

## Read-only frontend preflight

`infra/scripts/verify-isolated-frontend.py` checks a separately created, Basic-protected QA branch against the exact local and remote `main` commit, its successful Amplify build, and the staging health endpoints. It pins the expected AWS account, app, region and staging API before sending QA credentials. Supply those credentials only through `ISOLATED_QA_BASIC_USERNAME` and `ISOLATED_QA_BASIC_PASSWORD`; do not pass them on the command line or reuse production credentials. Its IAM caller needs read access to that specific QA branch. No IAM permissions are granted by the script.

This is a preflight only: it does not validate the staging instance identity or database isolation, execute browser tests, verify cleanup, or authorize promotion. Its output explicitly records those gates as incomplete. Never treat its success as a production deployment approval.

`infra/scripts/run-isolated-staging-smoke.sh` runs the existing read-only browser smoke suite only after this preflight passes. Set the QA branch, exact commit, matching `PLAYWRIGHT_BASE_URL` and QA-only Basic credentials in the environment. It refuses mutation tests and never promotes an image. It is not wired into the release workflow; mutation tests and their database-isolation proof require separate orchestration.
