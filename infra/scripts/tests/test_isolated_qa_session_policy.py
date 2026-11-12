import json
from pathlib import Path
import unittest


class QaSessionPolicyTest(unittest.TestCase):
    def test_lifecycle_and_repository_read_are_limited_to_named_resources(self):
        path = Path(__file__).resolve().parents[2] / 'aws' / 'isolated-qa-session-policy.proposed.json'
        statements = json.loads(path.read_text())['Statement']
        self.assertEqual(set(statements[0]['Action']), {'ec2:StartInstances', 'ec2:StopInstances'})
        self.assertEqual(statements[0]['Resource'],
                         'arn:aws:ec2:ap-northeast-2:439777528445:instance/i-02cf5b8f3a7aa32da')
        self.assertEqual(statements[1]['Action'], 'ecr:DescribeRepositories')
        self.assertEqual(statements[1]['Resource'],
                         'arn:aws:ecr:ap-northeast-2:439777528445:repository/herfree-api')


if __name__ == '__main__':
    unittest.main()
