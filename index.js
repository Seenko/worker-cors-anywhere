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
  let url = extractProxiedURL(new URL(request.url))

  if (!url) return new Response('worker-cors-anywhere', { status: 200 })

  try {
    url = validateProxiedURL(url)
  } catch {
    return new Response(`Invalid URL: ${url}`, { status: 400 })
  }

  if (!verifyLists(url)) return new Response(`Blocked hostname: ${url.hostname}`, { status: 403 })

  let response = await fetch(url)

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
function validateProxiedURL(url) {
  return new URL(url)
}

/**
 * Verifies URL domain agains allow/block lists
 *
 * @param url {urk} The URL that's being checked
 * @return {bool} URL object for specified URL string
 */
function verifyLists(url) {
  const allowList = process.env.WCA_DOMAIN_ALLOW_LIST ? process.env.WCA_DOMAIN_ALLOW_LIST.split(',') : []
  const blockList = process.env.WCA_DOMAIN_BLOCK_LIST ? process.env.WCA_DOMAIN_BLOCK_LIST.split(',') : []

  if (allowList.length > 0 && !allowList.includes(url.hostname)) return false
  if (blockList.length > 0 && blockList.includes(url.hostname)) return false

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
 * Clones response headers and adds required
 * headers to enable CORS anywhere
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