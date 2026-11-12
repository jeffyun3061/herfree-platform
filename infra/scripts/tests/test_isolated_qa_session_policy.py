import json
from pathlib import Path
import unittest


class QaSessionPolicyTest(unittest.TestCase):
    def test_lifecycle_is_limited_to_staging_and_list_is_regional(self):
        path = Path(__file__).resolve().parents[2] / 'aws' / 'isolated-qa-session-policy.proposed.json'
        statements = json.loads(path.read_text())['Statement']
        self.assertEqual(set(statements[0]['Action']), {'ec2:StartInstances', 'ec2:StopInstances'})
        self.assertEqual(statements[0]['Resource'],
                         'arn:aws:ec2:ap-northeast-2:439777528445:instance/i-02cf5b8f3a7aa32da')
        self.assertEqual(set(statements[1]['Action']),
                         {'ec2:DescribeInstances', 'ssm:DescribeInstanceInformation', 'ssm:ListCommands'})
        self.assertEqual(statements[1]['Resource'], '*')
        self.assertEqual(statements[1]['Condition'], {'StringEquals': {'aws:RequestedRegion': 'ap-northeast-2'}})


if __name__ == '__main__':
    unittest.main()
