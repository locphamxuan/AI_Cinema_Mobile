// Read by modules at load time, so it is set before any app module is imported (the harness imports this first).
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'system-test.apps.googleusercontent.com';
