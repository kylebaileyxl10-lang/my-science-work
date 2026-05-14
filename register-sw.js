// Inside register-sw.js
const stockSW = "/uv/uv.sw.js"; // Make sure this matches your file name in the 'uv' folder
const swConfig = {
    scope: __uv$config.prefix,
};

async function registerSW() {
    if (!navigator.serviceWorker) {
        throw new Error("Your browser doesn't support service workers.");
    }
    await navigator.serviceWorker.register(stockSW, swConfig);
}