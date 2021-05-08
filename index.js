import whatwgURL from 'whatwg-url'
globalThis.URL = whatwgURL.URL

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Receives a HTTP request and replies
 * with a proxies resource response with
 * CORS enabled
 * 
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  let destinationURL = extractProxiedURL(new URL(request.url))
  let originUrl = request.headers.get('Origin') || request.headers.get('X-Requested-With')

  if (!destinationURL) return new Response('worker-cors-anywhere is up and running 👍', { status: 200 })

  try {
    destinationURL = validateURL(destinationURL)
  } catch {
    return new Response(`Invalid destination URL: ${destinationURL}`, { status: 400 })
  }

  if (!verifyDestinationHostname(destinationURL.hostname)) return new Response(`Blocked destination hostname: ${destinationURL.hostname}`, { status: 403 })

  if (WCA_REQUIRE_ORIGIN === 'true' && !originUrl) return new Response(`Missing required Origin/X-Requested-With header`, { status: 400 })

  if (originUrl) {
    try {
      originUrl = validateURL(originUrl)
    } catch {
      return new Response(`Invalid Origin/X-Requested-With URL: ${originUrl}`, { status: 400 })
    }
  
    if (!verifyOriginHostname(originUrl.hostname)) return new Response(`Blocked origin hostname: ${originUrl.hostname}`, { status: 403 })
  }

  const response = await fetch(destinationURL)

  return hijackResponse(response, headers => updateHeaders(request, headers))
}

/**
 * Exctracts URL from request url for the resource that will be proxied
 *
 * @param url {string} A string for the request URL
 * @return {string} The extract URL that will be proxied
 */
function extractProxiedURL(url) {
  const { pathname, search } = url
  return (`${pathname}${search}`).substr(1)
}

/**
 * Validates if an URL is valid or not
 *
 * @param url {string} A string for a possible URL
 * @return {url} URL object for specified URL string
 */
function validateURL(url) {
  return new URL(url)
}

/**
 * Verifies a requested hostname against an allow/block lists
 *
 * @param hostname {string} The hostname that's being checked
 * @return {bool} True or False wether the hostname is blocked or not
 */
function verifyDestinationHostname(hostname) {
  const destinationAllowList = WCA_DESTINATION_HOSTNAME_ALLOW_LIST ? WCA_DESTINATION_HOSTNAME_ALLOW_LIST.split(',') : []
  const destinationBlockList = WCA_DESTINATION_HOSTNAME_BLOCK_LIST ? WCA_DESTINATION_HOSTNAME_BLOCK_LIST.split(',') : []

  if (destinationAllowList.length > 0 && !destinationAllowList.includes(hostname)) return false
  if (destinationBlockList.length > 0 && destinationBlockList.includes(hostname)) return false

  return true
}

/**
 * Verifies the origin hostname against an allow/block lists
 *
 * @param hostname {string} The hostname that's being checked
 * @return {bool} True or False wether the hostname is blocked or not
 */
 function verifyOriginHostname(hostname) {
  const originAllowList = WCA_ORIGIN_HOSTNAME_ALLOW_LIST ? WCA_ORIGIN_HOSTNAME_ALLOW_LIST.split(',') : []
  const originBlockList = WCA_ORIGIN_HOSTNAME_BLOCK_LIST ? WCA_ORIGIN_HOSTNAME_BLOCK_LIST.split(',') : []

  if (originAllowList.length > 0 && !originAllowList.includes(hostname)) return false
  if (originBlockList.length > 0 && originBlockList.includes(hostname)) return false

  return true
}

/**
 * Clones existing headers into 
 * a new Headers object
 *
 * @param headers {headers} Headers object
 * @return {headers} A new non-immutable headers object
 */
function cloneHeaders(headers) {
  const clonedHeaders = new Headers();
  for (const [key, value] of headers.entries()) clonedHeaders.append(key, value)
  return clonedHeaders
}

/**
 * Hijacks resource response and recreate with
 * an optional header handler
 *
 * @param response {response} Resource request response
 * @param headerFunction {function} Optional function that can parse original response headers
 * @return {Promise<Response>} Response promise with CORS enabled
 */
function hijackResponse(response, headerFunction) {
  const headers = headerFunction ? headerFunction(cloneHeaders(response.headers)) : response.headers;

  return new Promise((resolve) => {
    return response.blob().then((blob) => {
      resolve(new Response(blob, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      }))
    })
  })

}

/**
 * Adds required and optional headers to enable CORS
 *
 * @param request {request} Original resource request
 * @param headers {headers} Response headers object
 * @return {headers} A new headers object with CORS enabled
 */
function updateHeaders(request, headers) {
  headers.set('Access-Control-Allow-Origin', '*')

  const accessControlMaxAgeOverride = request.headers.get('Access-Control-Max-Age-Override')
  if (request.method === 'OPTIONS' && accessControlMaxAge) headers.set('Access-Control-Max-Age', accessControlMaxAgeOverride)

  const accessControlRequestMethods = request.headers.get('Access-Control-Request-Methods')
  if (accessControlRequestMethods) headers.set('Access-Control-Allow-Methods', accessControlRequestMethods)

  const accessControlRequestHeaders = request.headers.get('Access-Control-Request-Headers')
  if (accessControlRequestHeaders) headers.set('Access-Control-Allow-Headers', accessControlRequestHeaders)

  headers.set('Access-Control-Expose-Headers', '*')

  return headers
}
