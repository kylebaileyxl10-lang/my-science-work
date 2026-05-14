importScripts('uv.bundle.js');
importScripts('uv.config.js');

/*globals __uv$config*/

const Ultraviolet = self.Ultraviolet;

const cspHeaders = [
    "cross-origin-embedder-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "content-security-policy",
    "content-security-policy-report-only",
    "expect-ct",
    "feature-policy",
    "origin-isolation",
    "strict-transport-security",
    "upgrade-insecure-requests",
    "x-content-type-options",
    "x-download-options",
    "x-frame-options",
    "x-permitted-cross-domain-policies",
    "x-powered-by",
    "x-xss-protection",
];

const emptyMethods = ["GET", "HEAD"];

class UVServiceWorker extends Ultraviolet.EventEmitter {
    constructor(config = __uv$config) {
        super();
        if (!config.prefix) config.prefix = "/uv/service/";
        this.config = config;
        this.bareClient = new Ultraviolet.BareClient();
    }

    route({ request }) {
        return request.url.startsWith(location.origin + this.config.prefix);
    }

    async fetch({ request }) {
        let fetchedURL;

        try {
            if (!request.url.startsWith(location.origin + this.config.prefix))
                return await fetch(request);

            const ultraviolet = new Ultraviolet(this.config);

            if (typeof this.config.construct === "function") {
                this.config.construct(ultraviolet, "service");
            }

            const db = await ultraviolet.cookie.db();

            ultraviolet.meta.origin = location.origin;
            ultraviolet.meta.base = ultraviolet.meta.url = new URL(
                ultraviolet.sourceUrl(request.url)
            );

            const requestCtx = new RequestContext(
                request,
                ultraviolet,
                !emptyMethods.includes(request.method.toUpperCase())
                    ? await request.blob()
                    : null
            );

            if (ultraviolet.meta.url.protocol === "blob:") {
                requestCtx.blob = true;
                requestCtx.base = requestCtx.url = new URL(requestCtx.url.pathname);
            }

            if (request.referrer && request.referrer.startsWith(location.origin)) {
                const referer = new URL(ultraviolet.sourceUrl(request.referrer));

                if (
                    requestCtx.headers.origin ||
                    (ultraviolet.meta.url.origin !== referer.origin &&
                        request.mode === "cors")
                ) {
                    requestCtx.headers.origin = referer.origin;
                }

                requestCtx.headers.referer = referer.href;
            }

            const cookies = (await ultraviolet.cookie.getCookies(db)) || [];
            const cookieStr = ultraviolet.cookie.serialize(
                cookies,
                ultraviolet.meta,
                false
            );

            requestCtx.headers["user-agent"] = navigator.userAgent;

            if (cookieStr) requestCtx.headers.cookie = cookieStr;

            const reqEvent = new HookEvent(requestCtx, null, null);
            this.emit("request", reqEvent);

            if (reqEvent.intercepted) return reqEvent.returnValue;

            fetchedURL = requestCtx.blob
                ? "blob:" + location.origin + requestCtx.url.pathname
                : requestCtx.url;

            const response = await this.bareClient.fetch(fetchedURL, {
                headers: requestCtx.headers,
                method: requestCtx.method,
                body: requestCtx.body,
                credentials: requestCtx.credentials,
                mode: requestCtx.mode,
                cache: requestCtx.cache,
                redirect: requestCtx.redirect,
            });

            const responseCtx = new ResponseContext(requestCtx, response);
            const resEvent = new HookEvent(responseCtx, null, null);

            this.emit("beforemod", resEvent);
            if (resEvent.intercepted) return resEvent.returnValue;

            for (const name of cspHeaders) {
                if (responseCtx.headers[name]) delete responseCtx.headers[name];
            }

            if (responseCtx.headers.location) {
                responseCtx.headers.location = ultraviolet.rewriteUrl(
                    responseCtx.headers.location
                );
            }

            if (["document", "iframe"].includes(request.destination)) {
                const header = responseCtx.getHeader("content-disposition");
                if (!/\s*?((inline|attachment);\s*?)filename=/i.test(header)) {
                    const type = /^\s*?attachment/i.test(header)
                        ? "attachment"
                        : "inline";
                    const [filename] = new URL(response.finalURL).pathname
                        .split("/")
                        .slice(-1);
                    responseCtx.headers["content-disposition"] =
                        `${type}; filename=${JSON.stringify(filename)}`;
                }
            }

            if (responseCtx.headers["set-cookie"]) {
                Promise.resolve(
                    ultraviolet.cookie.setCookies(
                        responseCtx.headers["set-cookie"],
                        db,
                        ultraviolet.meta
                    )
                ).then(() => {
                    self.clients.matchAll().then(function (clients) {
                        clients.forEach(function (client) {
                            client.postMessage({
                                msg: "updateCookies",
                                url: ultraviolet.meta.url.href,
                            });
                        });
                    });
                });
                delete responseCtx.headers["set-cookie"];
            }

            if (responseCtx.body) {
                switch (request.destination) {
                    case "script":
                        responseCtx.body = ultraviolet.js.rewrite(await response.text());
                        break;
                    case "worker":
                        {
                            const scripts = [
                                ultraviolet.bundleScript,
                                ultraviolet.clientScript,
                                ultraviolet.configScript,
                                ultraviolet.handlerScript,
                            ]
                                .map((script) => JSON.stringify(script))
                                .join(",");
                            responseCtx.body = `if (!self.__uv) {
                                ${ultraviolet.createJsInject(
                                    ultraviolet.cookie.serialize(
                                        cookies,
                                        ultraviolet.meta,
                                        true
                                    ),
                                    request.referrer
                                )}
                            importScripts(${scripts});
                            }\n`;
                            responseCtx.body += ultraviolet.js.rewrite(await response.text());
                        }
                        break;
                    case "style":
                        responseCtx.body = ultraviolet.rewriteCSS(await response.text());
                        break;
                    case "iframe":
                    case "document":
                        if (
                            responseCtx.getHeader("content-type") &&
                            responseCtx.getHeader("content-type").startsWith("text/html")
                        ) {
                            let modifiedResponse = await response.text();
                            responseCtx.body = ultraviolet.rewriteHtml(modifiedResponse, {
                                document: true,
                                injectHead: ultraviolet.createHtmlInject(
                                    ultraviolet.handlerScript,
                                    ultraviolet.bundleScript,
                                    ultraviolet.clientScript,
                                    ultraviolet.configScript,
                                    ultraviolet.cookie.serialize(cookies, ultraviolet.meta, true),
                                    request.referrer
                                ),
                            });
                        }
                        break;
                }
            }

            this.emit("response", resEvent);
            return new Response(responseCtx.body, {
                headers: responseCtx.headers,
                status: responseCtx.status,
                statusText: responseCtx.statusText,
            });
        } catch (err) {
            console.error(err);
            return new Response(err.toString(), { status: 500 });
        }
    }
}

self.UVServiceWorker = UVServiceWorker;

class ResponseContext {
    constructor(request, response) {
        this.request = request;
        this.raw = response;
        this.ultraviolet = request.ultraviolet;
        this.headers = {};
        for (const key in response.rawHeaders)
            this.headers[key.toLowerCase()] = response.rawHeaders[key];
        this.status = response.status;
        this.statusText = response.statusText;
        this.body = response.body;
    }
    getHeader(key) {
        if (Array.isArray(this.headers[key])) return this.headers[key][0];
        return this.headers[key];
    }
}

class RequestContext {
    constructor(request, ultraviolet, body = null) {
        this.ultraviolet = ultraviolet;
        this.request = request;
        this.headers = Object.fromEntries(request.headers.entries());
        this.method = request.method;
        this.body = body || null;
        this.cache = request.cache;
        this.redirect = request.redirect;
        this.credentials = "omit";
        this.mode = request.mode === "cors" ? request.mode : "same-origin";
    }
}

class HookEvent {
    #intercepted;
    #returnValue;
    constructor(data = {}, target = null, that = null) {
        this.#intercepted = false;
        this.#returnValue = null;
        this.data = data;
    }
    get intercepted() { return this.#intercepted; }
    get returnValue() { return this.#returnValue; }
    respondWith(input) {
        this.#returnValue = input;
        this.#intercepted = true;
    }
}

const sw = new UVServiceWorker();
self.addEventListener('fetch', event => event.respondWith(sw.fetch(event)));