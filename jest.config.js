/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: ["src/services/**/*.ts", "src/contexts/**/*.tsx", "!**/*.d.ts"],
  // Ignore React Native specific modules that can't run in Node
  transformIgnorePatterns: [
    "node_modules/(?!(@react-native|react-native|@react-native-firebase)/)",
  ],
};
