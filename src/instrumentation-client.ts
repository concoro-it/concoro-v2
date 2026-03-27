// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const replayEnabled = process.env.NEXT_PUBLIC_SENTRY_REPLAY_ENABLED === "true";
const tracesSampleRate = Number.parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "1");
const replaySessionSampleRate = Number.parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE ?? "0.1");
const replayOnErrorSampleRate = Number.parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE ?? "1");

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production" && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  // Replay is optional and can be turned off to reduce client/network overhead.
  integrations: replayEnabled ? [Sentry.replayIntegration()] : [],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: replayEnabled && Number.isFinite(replaySessionSampleRate) ? replaySessionSampleRate : 0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: replayEnabled && Number.isFinite(replayOnErrorSampleRate) ? replayOnErrorSampleRate : 0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
