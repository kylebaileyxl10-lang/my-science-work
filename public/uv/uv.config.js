/* Updated uv.config.js for v3.2.10 */
self.__uv$config = {
    prefix: "/uv/service/",
    bare: "/bare/", 
    wisp: "wss://ruby.rubynetwork.co/wisp/", 
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
};
