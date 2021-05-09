[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Seenko/worker-cors-anywhere)
# ⚒🗺 `worker-cors-anywhere` 🗺⚒

A [Cloudflare Worker](https://developers.cloudflare.com/workers/learning/how-workers-works) that proxies any request and injects certain headers that allows the resource to be accessed from cross origins.

This worker allows any fully qualified URL to be proxied, if for some reason an invalid URL is provided, it will return a `400 Bad Request` response containing the faulty URL `string`.

## How to Use
Once you have this Cloudflare Worker up and running, you can just prepend its url to whatever resource needs CORS.

```javascript
const corsProxy = 'https://worker.example.com/'

// This is a direct request, which will be blocked.
myRealRequest('https://blocked.cors.net/resource.jpg?id=1234')

// This is a proxied request, which will _not_ be blocked.
myRealRequest(`${corsProxy}https://blocked.cors.net/resource.jpg?id=1234`)

function myRealRequest(url) {
  fetch(url).then(response => myProcessingFunction(response))
}
```

## Injected Headers

**Constant Headers** - Headers that will always be returned in the response
|Header|Value|
|--|--|
|`Access-Control-Allow-Origin`|\*|
|`Access-Control-Expose-Headers`|\*|

**Variable Headers** - These headers have special behaviors depending if they are used or not during the request
|Header|Behavior|
|--|--|
|`Access-Control-Max-Age-Override`|Value is cloned into `Access-Control-Max-Age`|
|`Access-Control-Request-Methods`|Value is cloned into `Access-Control-Allow-Methods`|
|`Access-Control-Request-Headers`|Value is cloned into `Access-Control-Request-Headers`|

## Environment Variables
These are the environment variables that are currently supported
|Environment Variable|Description|Response when Triggered|
|--|--|--|
|`WCA_DESTINATION_HOSTNAME_ALLOW_LIST`|Comma separated list of domains that are allowed to be proxied|`403 Forbidden`|
|`WCA_DESTINATION_HOSTNAME_BLOCK_LIST`|Comma separated list of domains that are blocked from being proxied|`403 Forbidden`|
|`WCA_REQUIRE_ORIGIN`|If set to true, either the Origin or X-Requested-With headers are required|`400 Bad Request`|
|`WCA_ORIGIN_HOSTNAME_ALLOW_LIST`|Comma separated list of origin domains that are allowed to request a proxied resource|`403 Forbidden`|
|`WCA_ORIGIN_HOSTNAME_BLOCK_LIST`|Comma separated list of origin domains that are blocked from requesting a proxied resource|`403 Forbidden`|

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
