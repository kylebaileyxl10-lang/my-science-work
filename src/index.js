import { join } from "node:path";
import { hostname } from "node:os";
import { createServer } from "node:http";
import express from "express";
import wisp from "wisp-server-node";

import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const app = express();
const publicPath = join(process.cwd(), "public");

// Load our publicPath first and prioritize it
app.use(express.static(publicPath));

// Load vendor files
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

// Error for everything else (404)
app.use((req, res) => {
    res.status(404);
    res.sendFile(join(publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    app(req, res);
});

server.on("upgrade", (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
        return;
    } 
    socket.end();
});

// Vercel handles the port automatically, but this keeps local dev working
let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8080;

if (process.env.NODE_ENV !== 'production') {
    server.listen({ port }, () => {
        const address = server.address();
        console.log(`Listening on http://localhost:${address.port}`);
    });
}

// CRITICAL FOR VERCEL: Export the express app
export default app;
