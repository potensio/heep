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
      if (podfileContent.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES")) {
        return config;
      }

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

      if (podfileContent.includes("post_install do |installer|")) {
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${postInstallFix}`
        );
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
