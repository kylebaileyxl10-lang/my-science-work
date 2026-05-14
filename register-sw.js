"use strict";

const stockSW = "/uv/uv.sw.js"; 
const swConfig = {
    scope: __uv$config.prefix,
};

async function registerSW() {
    if (!navigator.serviceWorker) {
        throw new Error("Your browser doesn't support service workers.");
    }
    await navigator.serviceWorker.register(stockSW, swConfig);
}