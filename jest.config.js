module.exports = {
  preset: 'jest-expo',
  // Rendering suites are slow on a loaded machine; the 5 s default timed some out when every core ran a suite.
  testTimeout: 20000,
  maxWorkers: '50%',
  // Only `*.test.*` files are suites: the system tests keep their shared harness under `__tests__/system/support`.
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  // AsyncStorage has no native module under Jest; every suite gets the package's in-memory mock.
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', '!**/*.d.ts', '!src/__tests__/**'],
  coverageReporters: ['text-summary', 'lcov'],
};
