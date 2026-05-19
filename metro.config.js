const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// NativeWind v4 metro configuration
const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(config, {
  input: "./global.css",
});
