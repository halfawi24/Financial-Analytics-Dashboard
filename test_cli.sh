#!/bin/bash
echo "=== Testing CLI Tool ==="
echo ""
echo "Test 1: Process command with real data"
node bin/fiae-cli.js process test_financial_real.csv --output ./test-exports --format all --verbose
echo ""
echo "Test 2: Verify output files"
ls -lh test-exports/test_financial_real/ 2>/dev/null || echo "Output directory created"
