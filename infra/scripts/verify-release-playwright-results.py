#!/usr/bin/env python3
"""Refuse incomplete, skipped or flaky isolated release browser suites."""
import argparse
import json
from pathlib import Path
import sys


class Refused(ValueError):
    pass


def verify(report, required):
    if not isinstance(report, dict) or not isinstance(report.get('suites'), list):
        raise Refused('REPORT_INVALID')
    stats = report.get('stats')
    if not isinstance(stats, dict) or any(stats.get(key) != 0 for key in ('skipped', 'unexpected', 'flaky')):
        raise Refused('TESTS_NOT_ALL_PASSED')
    counts = {key: 0 for key in required}
    total = 0
    def visit(suite, ancestors):
        nonlocal total
        if not isinstance(suite, dict) or not isinstance(suite.get('title'), str):
            raise Refused('REPORT_INVALID')
        names = ancestors + [suite['title']]
        for spec in suite.get('specs', []):
            if not isinstance(spec, dict) or not isinstance(spec.get('tests'), list):
                raise Refused('REPORT_INVALID')
            for test in spec['tests']:
                if (not isinstance(test, dict) or test.get('status') != 'expected'
                        or test.get('expectedStatus') != 'passed'):
                    raise Refused('TESTS_NOT_ALL_PASSED')
                project = test.get('projectName')
                matches = [(group, expected_project) for group, expected_project in required
                           if group in names and project == expected_project]
                if len(matches) != 1:
                    raise Refused('UNEXPECTED_TEST')
                counts[matches[0]] += 1
                total += 1
        for child in suite.get('suites', []):
            visit(child, names)
    for suite in report['suites']:
        visit(suite, [])
    if any(counts[key] < minimum for key, minimum in required.items()) or stats.get('expected') != total:
        raise Refused('TEST_COVERAGE_INCOMPLETE')
    return total


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('suite', choices=('sharing', 'regression'))
    parser.add_argument('report', type=Path)
    args = parser.parse_args()
    requirements = ({('isolated share QA', project): 1 for project in ('chromium', 'mobile-chromium', 'iphone-webkit')}
                    if args.suite == 'sharing' else {
                        ('release smoke', 'chromium'): 17, ('staging data flow', 'chromium'): 5,
                        ('bff staging data flow', 'chromium'): 2})
    try:
        with args.report.open(encoding='utf-8') as stream:
            count = verify(json.load(stream), requirements)
        print(json.dumps({'suite': args.suite, 'passed': count, 'promotionAllowed': False}))
        return 0
    except (OSError, ValueError, TypeError):
        print(json.dumps({'suite': args.suite, 'verified': False, 'promotionAllowed': False}), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
