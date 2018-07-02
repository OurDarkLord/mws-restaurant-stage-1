/**
 * Cache the js and css code of the site.
 */
var CACHE_NAME = 'restaurant-cache-v3';
var CACHE_NAME_FETCHES = 'fetchRequests-v1';
/*var precacheConfig = ["/css/styles.css", "/img/1.jpg", "/img/1.webp", "/img/10.jpg", "/img/10.webp", "/img/2.jpg", "/img/2.webp", "/img/3.jpg", "/img/3.webp", 
"/img/4.jpg", "/img/4.webp", "/img/5.jpg", "/img/5.webp" ,"/img/6.jpg", "/img/6.webp", "/img/7.jpg", "/img/7.webp", "/img/8.jpg", "/img/8.webp", "/img/9.jpg", 
"/img/9.webp" ,"/index.html", "/js/dbhelper.js", "/js/idb.js", "/js/main.js", "/js/restaurant_info.js", "/restaurant.html"];
*/
var filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/js/idb.js',
    '/js/dbhelper.js',
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('acitvate', function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(cacheName){
                // Remove all of the caches other then this cach name.
                if (cacheName !== CACHE_NAME || cacheName !== CACHE_NAME_FETCHES) return caches.delete(cacheName);
                return;
            })
    );
});

/**
 * Intercept request and returns the cache of it.
 * If there is no cache of it, save it in cache.
 * Ignore the google maps and restaurants fetches
 */
self.addEventListener('fetch', function(event){
    if (event.request.url.indexOf('localhost:1337') > 0  
    && event.request.url.indexOf('localhost:1337/restaurants') < 0 && event.request.method == "GET") {
        event.respondWith(CacheFetchExternal(event.request));
    } 
    else if (event.request.url.indexOf('localhost:8000') > 0 ) {
        event.respondWith(CacheFetch(event.request));
    } else {
        event.respondWith(
            fetch(event.request).then(function (response) {
                return response;
            })
        );
    }
});

CacheFetchExternal = (request) => {
    return caches.open(CACHE_NAME_FETCHES).then(function(cache) {
        return cache.match(request.url).then(function(response) {
            // Fetch the request to update the cache.
            return fetch(request.url)
                .then(function(res) {
                    if (!res) {
                        if (response) {
                            console.log(`can't fetch ${request.url}, using cache.`);
                            return response;
                        }
                        console.log('Fetch failed and there is no cached version of it.');
                        return res;
                    }
                    // Insert the new fetch in the cache.
                    cache.put(request.url, res.clone());
                    return res;
                    
                }).catch(function(error){
                    if (response) {
                        console.log(`can't fetch ${request.url}, using cache.`);
                        return response;
                    }
                    console.log('Fetch failed and there is no cached version of it.');
                    return error;
                });

        });
    });
};

CacheFetch = (request) => {
    return caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(request.url).then(function(response) {
            if (response){
                return response;
            } 
            return fetch(request).then(function(networkResponse) {
                if (!networkResponse) {
                    console.log(`can't fetch ${request.url}`);
                    return networkResponse;
                }
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            });
        });
    });
};
