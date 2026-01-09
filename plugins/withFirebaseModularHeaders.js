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
      if (podfileContent.includes("# Firebase modular headers fix")) {
        return config;
      }

      // Find the target block and add modular headers inside it
      const modularHeadersPods = `
    # Firebase modular headers fix
    pod 'GoogleUtilities', :modular_headers => true
    pod 'FirebaseCore', :modular_headers => true
    pod 'FirebaseCoreExtension', :modular_headers => true
    pod 'FirebaseCoreInternal', :modular_headers => true
    pod 'FirebaseFirestoreInternal', :modular_headers => true
    pod 'FirebaseSharedSwift', :modular_headers => true
`;

      // Insert after use_native_modules! line inside target block
      podfileContent = podfileContent.replace(
        /(use_native_modules!\(config_command\))/,
        `$1\n${modularHeadersPods}`
      );

      // Add post_install fix
      const postInstallFix = `
    # Fix RNFB non-modular headers
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
`;

      if (
        podfileContent.includes("post_install do |installer|") &&
        !podfileContent.includes("Fix RNFB non-modular")
      ) {
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${postInstallFix}`
        );
      }

      fs.writeFileSync(podfilePath, podfileContent);
      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
