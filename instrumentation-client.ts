// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

let tracesSampleRate = 0.1;

if (process.env.NODE_ENV === "development") {
  tracesSampleRate = 0;
}

Sentry.init({
  dsn: "https://eb78abcde019368e3f6384db4535152b@o4507095406608384.ingest.us.sentry.io/4510340276289536",
  enabled: process.env.NODE_ENV === "production",
  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: tracesSampleRate,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
