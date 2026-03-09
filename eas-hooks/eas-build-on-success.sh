#!/bin/bash

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  echo "=== Looking for mapping.txt ==="
  find android/app/build/outputs -name "mapping.txt" -type f 2>/dev/null
  echo "=== Looking for R8 output files ==="
  find android/app/build/outputs -name "*.txt" -type f 2>/dev/null
  echo "=== Done ==="
fi
