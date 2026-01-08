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

      // Add post_install hook to disable non-modular header warnings for RNFBApp
      const postInstallFix = `
  # Disable non-modular header warnings for React Native Firebase
  installer.pods_project.targets.each do |target|
    if target.name.start_with?('RNFB')
      target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] ||= ['$(inherited)']
        config.build_settings['OTHER_CFLAGS'] << '-Wno-non-modular-include-in-framework-module'
      end
    end
  end
`;

      // Insert the post_install fix before the closing 'end' of post_install block
      if (podfileContent.includes("post_install do |installer|")) {
        // Find the post_install block and add our fix before its end
        podfileContent = podfileContent.replace(
          /(post_install do \|installer\|[\s\S]*?)(^\s*end\s*$)/m,
          (match, postInstallContent, endStatement) => {
            // Check if our fix is already there
            if (
              postInstallContent.includes("Disable non-modular header warnings")
            ) {
              return match;
            }
            return postInstallContent + postInstallFix + endStatement;
          }
        );
      }

      fs.writeFileSync(podfilePath, podfileContent);
      console.log("Added Firebase static frameworks fix to Podfile");

      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
