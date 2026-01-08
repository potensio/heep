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

      // Check if modular headers are already added
      if (
        podfileContent.includes("GoogleUtilities") &&
        podfileContent.includes(":modular_headers => true")
      ) {
        console.log("Firebase modular headers already present in Podfile");
        return config;
      }

      const modularHeaders = `
# Enable modular headers for Firebase dependencies
pod 'GoogleUtilities', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreExtension', :modular_headers => true
pod 'FirebaseFirestoreInternal', :modular_headers => true

`;

      // Insert after prepare_react_native_project!
      podfileContent = podfileContent.replace(
        "prepare_react_native_project!",
        `prepare_react_native_project!\n${modularHeaders}`
      );

      fs.writeFileSync(podfilePath, podfileContent);
      console.log("Added Firebase modular headers to Podfile");

      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
