module.exports = {
  root: true,
  extends: ['expo'],
  rules: {
    // expo-video's player is an imperative object: seeking and changing speed are done by assigning
    // `currentTime` and `playbackRate`, and it has no setter method for them. The rule cannot tell that
    // from mutating a hook's return value, so the three assignments stay visible as warnings.
    'react-hooks/immutability': 'warn',
  },
};
