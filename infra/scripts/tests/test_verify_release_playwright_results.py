import copy
import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / 'verify-release-playwright-results.py'
spec = importlib.util.spec_from_file_location('release_results', path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ResultsTest(unittest.TestCase):
    def setUp(self):
        self.required = {('release smoke', 'chromium'): 1, ('staging data flow', 'chromium'): 1}
        item = {'status': 'expected', 'expectedStatus': 'passed', 'projectName': 'chromium'}
        self.report = {'stats': {'expected': 2, 'skipped': 0, 'unexpected': 0, 'flaky': 0}, 'suites': [
            {'title': 'e2e/release.spec.ts', 'suites': [
                {'title': 'release smoke', 'specs': [{'tests': [copy.deepcopy(item)]}]},
                {'title': 'staging data flow', 'specs': [{'tests': [copy.deepcopy(item)]}]},
            ]}]}

    def test_complete_pass_is_accepted(self):
        self.assertEqual(module.verify(self.report, self.required), 2)

    def test_skips_flakes_and_missing_suites_are_rejected(self):
        for key in ('skipped', 'unexpected', 'flaky'):
            report = copy.deepcopy(self.report)
            report['stats'][key] = 1
            with self.subTest(key=key), self.assertRaises(module.Refused): module.verify(report, self.required)
        report = copy.deepcopy(self.report)
        report['suites'][0]['suites'].pop()
        report['stats']['expected'] = 1
        with self.assertRaises(module.Refused): module.verify(report, self.required)

    def test_wrong_project_or_expected_failure_is_rejected(self):
        for field, value in [('projectName', 'other'), ('expectedStatus', 'failed'), ('status', 'flaky')]:
            report = copy.deepcopy(self.report)
            report['suites'][0]['suites'][0]['specs'][0]['tests'][0][field] = value
            with self.subTest(field=field), self.assertRaises(module.Refused): module.verify(report, self.required)


if __name__ == '__main__':
    unittest.main()
