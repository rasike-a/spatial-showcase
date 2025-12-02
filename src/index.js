import { SessionMode, World } from "@iwsdk/core";

import { startSpatialShowcase } from "./app/startSpatialShowcase.js";
import { logger } from "./utils/logger.js";

// Global error handling for debugging
window.addEventListener('error', (event) => {
  logger.error('[GlobalError]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    target: event.target,
    type: event.type
  });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('[UnhandledRejection]', event.reason);
});

const assets = {}; // no demo assets now

World.create(document.getElementById("scene-container"), {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: "always",
    features: {
      handTracking: false,
      layers: true
    }
  },
  features: {
    locomotion: { useWorker: true },
    grabbing: false,
    physics: false,
    sceneUnderstanding: false
  }
}).then((world) => {
  // Launch your custom application
  startSpatialShowcase(world);
});
