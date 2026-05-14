"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");

let connection;
try {
    connection = new BareMux.BareMuxConnection("/bare/");
} catch (e) {
    console.error("BareMux connection failed to initialize:", e);
}

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

    let wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    
    try {
        await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    } catch (e) {
        console.warn("Transport failed, attempting load anyway...");
    }

    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
});