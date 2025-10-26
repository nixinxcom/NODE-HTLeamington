console.log({
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').slice(0, 10) + '...',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
});
