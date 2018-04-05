/**
 * Cache the js and css code of the site.
 */
var CACHE_NAME = 'restaurant-cache-v2';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(
                [
                    '/',
                    '/css/styles.css',
                    '/js/main.js',
                    '/js/restaurant_info.js',
                    '/js/dbhelper.js'
                ]  
            );
        })
    );
});

/**
 * Intercept request and returns the cache of it.
 * If there is no cache of it, save it in cache.
 */
self.addEventListener('fetch', function(event){
    event.respondWith(CacheFetch(event.request))
});

CacheFetch = (request) => {
    return caches.open('fetchRequests').then(function(cache) {
        return cache.match(request.url).then(function(response) {
            if (response) return response;
            return fetch(request).then(function(networkResponse) {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

