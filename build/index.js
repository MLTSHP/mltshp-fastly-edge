//! MLTSHP Compute@Edge Service
/// <reference types="@fastly/js-compute" />
import { SecretStore } from "fastly:secret-store";
// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It
// could be used to route based on the request properties (such as method or
// path), send the request to a backend, make completely new requests, and/or
// generate synthetic responses.
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
async function handleRequest(event) {
    // Get the client request.
    let req = event.request;
    // Filter requests that have unexpected methods.
    if (!["HEAD", "GET", "PURGE"].includes(req.method)) {
        return new Response("This method is not allowed", {
            status: 405,
        });
    }
    let url = new URL(req.url);
    // If request is to the `/` path...
    if (url.pathname == "/robots.txt") {
        // Below are some common patterns for Fastly Compute services using JavaScript.
        // Head to https://developer.fastly.com/learning/compute/javascript/ to discover more.
        // Create a new request.
        const secretStore = new SecretStore("api-keys");
        const darkVisitorsApiKey = await secretStore.get("darkVisitorsApiKey");
        if (!darkVisitorsApiKey) {
            return new Response("API key not found", {
                status: 500,
            });
        }
        const bereq = new Request("https://api.darkvisitors.com/robots-txts", {
            body: JSON.stringify({
                agent_types: [
                    "AI Data Scraper",
                    "Undocumented AI Agent"
                ],
                disallow: "/"
            }),
            cacheKey: "darkVisitorsRobotsTxt",
            headers: {
                "Authorization": "Bearer " + darkVisitorsApiKey.plaintext(),
                "Content-Type": "application/json"
            },
            method: "POST",
        });
        // Forward the request to a backend.
        const beresp = await fetch(bereq, {
            backend: "DarkVisitors API Endpoint",
        });
        const data = await beresp.text();
        return new Response(data, {
            status: 200,
            headers: {
                "Cache-Control": "s-maxage=3600, max-age=0",
                "Content-Type": "text/plain",
            },
        });
    }
    // Catch all other requests and return a 404.
    return new Response("The page you requested could not be found", {
        status: 404,
    });
}
