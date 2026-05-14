"use strict";

async function registerSW() {
    if (!navigator.serviceWorker) {
        throw new Error("Your browser doesn't support service workers.");
    }
    
    // Pass the absolute path directly 
    await navigator.serviceWorker.register("/uv/uv.sw.js", {
        scope: __uv$config.prefix,
    });
}