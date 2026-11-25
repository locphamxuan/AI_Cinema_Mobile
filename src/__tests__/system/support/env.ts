// Read by modules at load time, so it is set before any app module is imported (the harness imports this first).
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'system-test.apps.googleusercontent.com';
// The harness unmounts the screen itself, after the app's own work has finished and before the stores are reset;
// the library's automatic clean-up would unmount first and leave that work running into the next test.
process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';
