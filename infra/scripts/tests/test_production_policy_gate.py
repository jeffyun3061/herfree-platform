import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
POWERSHELL = shutil.which("pwsh") or shutil.which("powershell.exe")
CHECKER = ROOT / "scripts/verify-legal-policy-alignment.ps1"


@unittest.skipUnless(POWERSHELL, "PowerShell is required")
class ProductionPolicyGateTests(unittest.TestCase):
    def fixture(self, directory, finalized=False):
        root = Path(directory)
        source = CHECKER.read_text(encoding="utf-8")
        paths = set(re.findall(r'ReadUtf8 "([^"]+)"', source))
        block = source.split("$requiredFiles = @(", 1)[1].split(")", 1)[0]
        paths.update(re.findall(r'"([^"]+)"', block))
        paths.add("scripts/verify-legal-policy-alignment.ps1")
        for relative in paths:
            destination = root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, destination)
        if finalized:
            # Synthetic fixture only; no operator facts or public notices are changed.
            for relative in ["frontend/src/app/privacy/page.tsx", "docs/legal/herfree-privacy-policy.md"]:
                path = root / relative
                text = path.read_text(encoding="utf-8")
                for marker in [
                    "실제 사용 사업자·국가를 배포 전 확정",
                    "배포 전 AWS·메일·분석 계약과 리전을 확인해야 합니다.",
                    "글로벌 지원·재위탁은 계약 확인 필요",
                    "글로벌 지원·재위탁·국외 접근 여부는 계약 확인 필요",
                    "배포 전 AWS 계정의 리전·지원 범위와 실제 메일·분석 사업자를 확인하는 것이 필수입니다.",
                ]:
                    text = text.replace(marker, "synthetic-provider synthetic-country")
                path.write_text(text, encoding="utf-8")
        return root / "scripts/verify-legal-policy-alignment.ps1"

    def run_checker(self, path, reviewed="true"):
        env = dict(os.environ)
        block = CHECKER.read_text(encoding="utf-8").split("$factNames = @(", 1)[1].split(")", 1)[0]
        names = re.findall(r'"([A-Z_]+)"', block)
        env.update({name: "synthetic-fixture" for name in names})
        env["LEGAL_OPERATOR_CONFIRMED"] = "true"
        env["PRIVACY_CONTACT_CONFIRMED"] = "true"
        env["LEGAL_AWS_CROSS_BORDER_ACCESS_REVIEWED"] = reviewed
        env["LEGAL_MAIL_PROVIDER"] = "synthetic-provider"
        env["LEGAL_MAIL_PROVIDER_COUNTRY"] = "synthetic-country"
        env["LEGAL_AWS_REGION"] = env["AWS_REGION"] = "ap-northeast-2"
        service = (ROOT / "backend/src/main/java/com/herfree/domain/user/service/UserConsentAgreementService.java").read_text(encoding="utf-8")
        env["LEGAL_POLICY_REVIEWED_VERSION"] = re.search(r'PRIVACY_VERSION\s*=\s*"([^"]+)"', service).group(1)
        env["LEGAL_OPERATIONAL_REVIEW_REFERENCE"] = "record:synthetic-test"
        env.pop("NEXT_PUBLIC_POSTHOG_KEY", None)
        return subprocess.run([POWERSHELL, "-NoProfile", "-File", str(path), "-StrictOperationalFacts"],
                              env=env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30)

    def test_unreviewed_transfer_facts_cannot_pass_by_being_nonempty(self):
        with tempfile.TemporaryDirectory() as directory:
            path = self.fixture(directory, finalized=True)
            rejected = self.run_checker(path, reviewed="false")
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn("document the review", rejected.stdout)
            reviewed = self.run_checker(path)
            self.assertNotEqual(reviewed.returncode, 0)
            self.assertIn("community health consent and withdrawal", reviewed.stdout)
            self.assertNotIn("document the review", reviewed.stdout)

    def test_complete_facts_cannot_override_unimplemented_community_consent(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_checker(self.fixture(directory, finalized=True))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("separate community consent, immediate hiding and deletion-request handling are not implemented", result.stdout)

    def test_private_fact_values_do_not_finalize_a_public_draft(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_checker(self.fixture(directory))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("published operational legal facts", result.stdout)
            self.assertIn("replace unresolved provider/transfer draft text", result.stdout)

    def test_legacy_rds_setup_requires_separate_explicit_intent_before_aws(self):
        result = subprocess.run([POWERSHELL, "-NoProfile", "-File", str(ROOT / "scripts/setup-production-aws.ps1")],
                                capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ConfirmLegacyRdsProvisioning", result.stdout + result.stderr)
        self.assertNotIn("Production AWS setup", result.stdout)


if __name__ == "__main__":
    unittest.main()
