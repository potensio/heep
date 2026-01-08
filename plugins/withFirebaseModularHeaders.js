const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      let podfileContent = fs.readFileSync(podfilePath, "utf8");

      // Skip if already modified
      if (podfileContent.includes("# Firebase static frameworks fix")) {
        console.log("Firebase fix already present in Podfile");
        return config;
      }

      const firebaseFix = `
# Firebase static frameworks fix
use_frameworks! :linkage => :static
$RNFirebaseAsStaticFramework = true

# Enable modular headers for Firebase dependencies
pod 'GoogleUtilities', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreExtension', :modular_headers => true
pod 'FirebaseFirestoreInternal', :modular_headers => true
pod 'FirebaseSharedSwift', :modular_headers => true

`;

      // Insert after prepare_react_native_project!
      podfileContent = podfileContent.replace(
        "prepare_react_native_project!",
        `prepare_react_native_project!\n${firebaseFix}`
      );

      fs.writeFileSync(podfilePath, podfileContent);
      console.log("Added Firebase static frameworks fix to Podfile");

      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
