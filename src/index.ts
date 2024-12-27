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

async function handleRequest(event: FetchEvent) {
  // Get the client request.
  const req = event.request;

  // Filter requests that have unexpected methods.
  if (!["HEAD", "GET", "PURGE"].includes(req.method)) {
    return new Response("This method is not allowed", {
      status: 405,
    });
  }

  const url = new URL(req.url);

  // If request is to the `/robots.txt` path...
  if (url.pathname == "/robots.txt") {
    const secretStore = new SecretStore("api-keys");
    const darkVisitorsApiKey = await secretStore.get("darkVisitorsApiKey");
    if (!darkVisitorsApiKey) {
      return new Response("API key not found", {
        status: 500,
      });
    }

    const mltshpRobotsTxtReq = new Request("https://mltshp.com/static/robots.txt", {
      cacheKey: "mltshpRobotsTxt",
    });
    const mltshpRobotsTxtResp = await fetch(mltshpRobotsTxtReq, {
      backend: "mltshp.com",
    });
    const mltshpRobotsTxtData = await mltshpRobotsTxtResp.text();

    const darkVisitorsReq = new Request("https://api.darkvisitors.com/robots-txts", {
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
    const darkVisitorsResp = await fetch(darkVisitorsReq, {
      backend: "DarkVisitors API Endpoint",
    });

    const darkVisitorsData = await darkVisitorsResp.text();

    const robotsTxt = `${mltshpRobotsTxtData}

### DarkVisitors

${darkVisitorsData}
`;
    return new Response(robotsTxt, {
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
