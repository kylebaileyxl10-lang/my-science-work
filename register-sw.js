"use strict";
const stockSW = "/uv/uv.sw.js";
const swConfig = {
  scope: "/uv/service/",
};

async function registerSW() {
  if (!navigator.serviceWorker) {
    throw new Error("Your browser doesn't support service workers.");
  }

  // This matches the error path shown in your console
  await navigator.serviceWorker.register(stockSW, swConfig);
}