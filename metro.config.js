const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/private/defaults/exclusionList").default;

const config = getDefaultConfig(__dirname);

// Blacklist folders from Metro watch to improve performance
config.resolver.blockList = exclusionList([
  // Build outputs
  /.*\/build\/.*/,
  /.*\/dist\/.*/,
  // Test coverage
  /.*\/coverage\/.*/,
  // Version control and IDE
  /.*\.git\/.*/,
  /.*\.idea\/.*/,
  /.*\.vscode\/.*/,
  // Expo
  /.*\.expo\/.*/,
  // Git worktrees
  /.*\.worktrees\/.*/,
  // Jest
  /.*jest\.config\.js$/,
  // Logs
  /.*\.log$/,
  // OS files
  /.*\.DS_Store$/,
  // npm files
  /.*\.npmrc$/,
  // Docs folder (not needed for bundling)
  /.*\/docs\/.*/,
  // Public folder (for web, not mobile)
  /.*\/public\/.*/,
  // Lock files
  /.*package-lock\.json$/,
]);

// NativeWind v4 metro configuration
const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(config, {
  input: "./global.css",
});
