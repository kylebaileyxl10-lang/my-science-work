"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");

// Fix for image_a0b7a2.png line 10:
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

    // Use a public Wisp server so you don't have to host one
    const wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    
    try {
        await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    } catch (e) {
        console.warn("Transport setup failed, trying anyway...");
    }

    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
});