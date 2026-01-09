const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * This plugin fixes the "non-modular header inside framework module" error
 * that occurs with React Native Firebase + New Architecture + useFrameworks: static
 *
 * It adds CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
 * to RNFB pod targets in the post_install hook
 */
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
      if (
        podfileContent.includes(
          "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"
        )
      ) {
        console.log("✅ Firebase modular headers fix already present");
        return config;
      }

      // The fix: Add build settings to allow non-modular includes for RNFB targets
      const postInstallFix = `
    # [RNFB] Fix non-modular header includes for React Native Firebase
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
`;

      // Insert the fix right after "post_install do |installer|"
      if (podfileContent.includes("post_install do |installer|")) {
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${postInstallFix}`
        );

        fs.writeFileSync(podfilePath, podfileContent);
        console.log("✅ Added Firebase modular headers fix to Podfile");
      } else {
        console.warn("⚠️ Could not find post_install block in Podfile");
      }

      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
