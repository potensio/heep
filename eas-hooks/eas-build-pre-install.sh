#!/bin/bash

# This script runs before EAS installs dependencies
# It modifies the Podfile to add modular headers for Firebase dependencies

if [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  echo "Adding modular headers for Firebase dependencies..."
  
  # Create the modular headers block to insert
  MODULAR_HEADERS="
# Enable modular headers for Firebase dependencies
pod 'GoogleUtilities', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreExtension', :modular_headers => true
pod 'FirebaseFirestoreInternal', :modular_headers => true
"

  # Insert after prepare_react_native_project! line
  sed -i '' "/prepare_react_native_project!/a\\
$MODULAR_HEADERS
" ios/Podfile

  echo "Podfile modified successfully"
  cat ios/Podfile | head -30
fi
