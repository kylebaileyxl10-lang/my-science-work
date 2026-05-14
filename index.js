"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        await registerSW();
    } catch (err) {
        alert("Failed to register Service Worker: " + err.message);
        throw err;
    }

    const url = search(address.value, searchEngine.value);
    // Use the v2 encode function from your config
    location.href = __uv$config.prefix + __uv$config.encodeUrl(url);
});