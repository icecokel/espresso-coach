#!/usr/bin/env sh

rm -rf dist output/playwright

npx expo export --platform web --output-dir dist
export_status=$?
if [ "$export_status" -ne 0 ]; then
  rm -rf dist
  exit "$export_status"
fi

npx playwright test
test_status=$?
rm -rf dist

if [ "$test_status" -eq 0 ]; then
  rm -rf output/playwright
fi

exit "$test_status"
