import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  integrations: [
    Sentry.replayIntegration({
      maskAllInputs: false,
      maskAllText: false,
    }),
  ],
  debug: false,
});

Sentry.setUser({
  id: "demo-user-1",
  username: "demo-user",
  email: "demo@werkdone.com",
});
