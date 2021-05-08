[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Seenko/worker-cors-anywhere)
# 🗺 `worker-cors-anywhere` 🗺

A [Cloudflare Worker](https://developers.cloudflare.com/workers/learning/how-workers-works) that proxies any request and injects certain headers that allows the resource to be accessed from cross origins.

This worker allows any URL to be proxied, if for some reason an invalid URL is provided, it will return a `400 Bad Request` response containing the faulty URL `string`.

## How to Use
Once you have this Cloudflare Worker up and running, you can just prepend its url to whatever resource needs CORS.

If my worker is running at: `https://worker.example.com/`  
The blocked resource is: `https://blocked.cors.net/resource.jpg?id=1234`  
Then: `https://worker.example.com/https://blocked.cors.net/resource.jpg?id=1234`

## Injected Headers

**Constant Headers** - Headers that will always be returned in the response
|Header|Value|
|--|--|
|Access-Control-Allow-Origin|\*|
|Access-Control-Expose-Headers|\*|

**Variable Headers** - These headers have special behavior depending if they are used or not during the request
|Header|Behavior|
|--|--|
|Access-Control-Max-Age-Override|*Cloned into* Access-Control-Max-Age|
|Access-Control-Request-Methods|*Cloned into* Access-Control-Allow-Methods|
|Access-Control-Request-Headers|*Cloned into* Access-Control-Request-Headers|

## Environment Variables
These are the environment variables that are currently supported
|EnvVar|Description|
|--|--|
|WCA_DESTINATION_HOSTNAME_ALLOW_LIST|List of domains that are allowed to be proxied|
|WCA_DESTINATION_HOSTNAME_BLOCK_LIST|List of domains that are blocked from being proxied|
|WCA_REQUIRE_ORIGIN|If set to true, either the Origin or X-Requested-With headers are required|
|WCA_ORIGIN_HOSTNAME_ALLOW_LIST|List of origin domains that are allowed to request a proxied resource|
|WCA_ORIGIN_HOSTNAME_BLOCK_LIST|List of origin domains that are blocked from requesting a proxied resource|

## ⚠️ Dependencies Disclaimer ⚠️
This project currently has only two dependencies, this is because of the [current bugged state of the built-in runtime URL library](https://community.cloudflare.com/t/bug-inconsistent-url-behaviour/98044), which causes URLs to be improperly parsed, example:  
Input: `https://worker-cors-anywhere.example.com/https://www.google.com/`  
Output: `https://worker-cors-anywhere.example.com/https:/www.google.com/` (It loses a `/` from the first `//` found in the URL `path`)

Therefore, [whatwg-url](https://www.npmjs.com/package/whatwg-url) is used as a URL substitute and [webpack](https://www.npmjs.com/package/webpack) to build the project into a single Cloudflare Workers compatible script.

## Wrangler
To generate using [wrangler](https://github.com/cloudflare/wrangler)

```
wrangler generate projectname https://github.com/Seenko/worker-cors-anywhere
```

Further documentation for Wrangler can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler).
