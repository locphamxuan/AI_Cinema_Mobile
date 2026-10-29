module.exports = {
  root: true,
  extends: ['expo'],
  rules: {
    // React Compiler rules that eslint-config-expo 58 turns on. The app does not run the compiler,
    // and the flagged code (imperative expo-video player, latest-callback refs, fetch-on-change
    // effects) is correct without it; keep them visible until the screens are reworked for it.
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/immutability': 'warn',
  },
};
