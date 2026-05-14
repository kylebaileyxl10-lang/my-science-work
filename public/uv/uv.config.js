/* This file overwrites the stock UV config.js */

self.__uv$config = {
    prefix: "/uv/service/",
    bare: "/bare/", 
    wisp: "wss://wisp.mercurynetwork.org/", // This connects you to a working proxy server
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
};
