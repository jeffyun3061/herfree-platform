# Title-sharing candidate and rollback exercise

This is test evidence, not a production promotion record. No production release was performed by this exercise.

On 2026-10-31 (Asia/Seoul), an isolated staging run used frontend candidate `ca25f85f7edc70b0683dd018daae9364cfc0581e`, a temporary Basic-authenticated Amplify branch, and a temporary empty MySQL database on the staging host. The staging host, its normal instance profile, HTTPS routing, private MySQL networking and Basic authentication were checked before synthetic data was created. The existing staging database was preserved.

The title-sharing API and browser test confirmed explicit title consent, no body or nickname in the preview, withdrawal of preview consent, and member/guest behavior. The synthetic post and account were deleted. The first attempt encountered a browser heading timeout; the repeat passed after the test recorded response statuses and used a longer timeout. The cause of the first timeout was not established.

The repeat then switched the running API, on the same migrated synthetic database, to a rollback image built from `6faf5effd4f2fa4f508805274c7d3f478807ab22`. Its backend and Dockerfile trees matched rollback PR head `f0f2dc7c441978ab907926cb97b471c5546b1c18`; the image digest was `sha256:ecff222726dd1d97e961fa4deec7436f13b5f0bc382ca39b1c683f48865a058e`. The image passed the high/critical vulnerability scan before use. The rollback image became healthy with V47 and its column present; member and guest browser checks passed and their synthetic data was deleted.

The candidate image was the previously scanned immutable digest `sha256:b27dcc451e665f08564f2ea164a821b79f38aed2a3f14cdaf5ff027cfae27902` retained in the staging Docker cache. The isolated harness checked the digest existed locally and used a temporary deployment-script copy with pull disabled for this exercise. This differs from the regular production release workflow and is not evidence that workflow's promotion gate passed.

The staging host's previous environment and image were restored. The temporary DB and its schema-specific grant were removed; the cleanup reported no issues. An independent check confirmed the EC2 instance was stopped and the temporary Amplify and Git branches were absent. Temporary GitHub staging-environment branch access used for the image build was removed.

Local iPhone WebKit and mobile Chromium emulation passed the opt-in and guest guidance tests. Physical devices, app WebViews and third-party preview-cache behavior were not tested.

Before production, establish a reviewed release path that preserves the unrelated `develop` work and satisfies the exact-main staging promotion requirement. Production's current fallback image predates V47, so the tested compatible rollback image must be integrated into the real release and recovery procedure; merely retaining the old image is insufficient. Recheck backup and deployed revisions immediately before any authorized release.
