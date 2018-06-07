/**
 * Cache the js and css code of the site.
 */
var CACHE_NAME = 'restaurant-cache-v2';
/*var precacheConfig = ["/css/styles.css", "/img/1.jpg", "/img/1.webp", "/img/10.jpg", "/img/10.webp", "/img/2.jpg", "/img/2.webp", "/img/3.jpg", "/img/3.webp", 
"/img/4.jpg", "/img/4.webp", "/img/5.jpg", "/img/5.webp" ,"/img/6.jpg", "/img/6.webp", "/img/7.jpg", "/img/7.webp", "/img/8.jpg", "/img/8.webp", "/img/9.jpg", 
"/img/9.webp" ,"/index.html", "/js/dbhelper.js", "/js/idb.js", "/js/main.js", "/js/restaurant_info.js", "/restaurant.html"];
*/
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(
                [
                    '/',
                    '/index.html',
                    '/restaurant.html',
                    '/css/styles.css',
                    '/js/main.js',
                    '/js/restaurant_info.js',
                    '/js/dbhelper.js',
                ]  
            );
        })
    );
});

/**
 * Intercept request and returns the cache of it.
 * If there is no cache of it, save it in cache.
 * Ignore the google maps fetches
 */
self.addEventListener('fetch', function(event){
    if (event.request.url.indexOf('maps') > 0 || event.request.url.indexOf('restaurants') > 0 ) {
        event.respondWith(
            fetch(event.request).then(function (response) {
                return response;
            })
        );
    } else {
        event.respondWith(CacheFetch(event.request));
    }
});

CacheFetch = (request) => {
    return caches.open('fetchRequests').then(function(cache) {
        return cache.match(request.url).then(function(response) {
            if (response){
                return response;
            } 
            return fetch(request).then(function(networkResponse) {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            });
        });
    });
};
