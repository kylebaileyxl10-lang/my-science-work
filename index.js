"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");

// Use the global connection provided by the CDN
const connection = new BareMux.BareMuxConnection("/bare/");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        await registerSW();
    } catch (err) {
        error.textContent = "Failed to register service worker.";
        errorCode.textContent = err.toString();
        throw err;
    }

    const url = search(address.value, searchEngine.value);

    let frame = document.getElementById("uv-frame");
    frame.style.display = "block";

    // Standard Wisp configuration for Vercel
    let wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    
    try {
        // This ensures the connection is ready before setting the transport
        await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    } catch (e) {
        console.error("Transport failed, but attempting to load anyway...");
    }

    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
});