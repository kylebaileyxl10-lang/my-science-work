"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        // registerSW() must be defined in register-sw.js
        await registerSW();
    } catch (err) {
        error.textContent = "Failed to register Service Worker.";
        errorCode.textContent = err.toString();
        throw err;
    }

    // search() must be defined in search.js
    const url = search(address.value, searchEngine.value);

    // Redirect the current window to the proxied URL using v2 config
    location.href = __uv$config.prefix + __uv$config.encodeUrl(url);
});