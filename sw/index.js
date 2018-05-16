let staticCacheName = 'project1';

self.addEventListener('install', (event) => {
    console.log("Arxhse h eggrafh");
    event.waitUntil(
        caches.open(staticCacheName)
            .then((cache) => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/restaurant.html',
                    '/css/styles.css',
                    '/images/1-450_small.jpg', '/images/1-600_medium.jpg','/images/1-800_large.jpg',
                    '/images/2-450_small.jpg', '/images/2-600_medium.jpg','/images/2-800_large.jpg',
                    '/images/3-450_small.jpg', '/images/3-600_medium.jpg','/images/3-800_large.jpg',
                    '/images/4-450_small.jpg', '/images/4-600_medium.jpg','/images/4-800_large.jpg',
                    '/images/5-450_small.jpg', '/images/5-600_medium.jpg','/images/5-800_large.jpg',
                    '/images/6-450_small.jpg', '/images/6-600_medium.jpg','/images/6-800_large.jpg',
                    '/images/7-450_small.jpg', '/images/7-600_medium.jpg','/images/7-800_large.jpg',
                    '/images/8-450_small.jpg', '/images/8-600_medium.jpg','/images/8-800_large.jpg',
                    '/images/9-450_small.jpg', '/images/9-600_medium.jpg','/images/9-800_large.jpg',
                    '/images/10-450_small.jpg', '/images/10-600_medium.jpg','/images/10-800_large.jpg',
                    '/js/main.js',
                    '/js/dbhelper.js',
                    '/js/restaurant_info.js',
                    '/data/restaurants.json'
                ])
            })
    )
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                var fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(response) {
                        // Check if we received a valid response
                        if(!response || response.status !== 200) {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        let responseToCache = response.clone();

                        caches.open(staticCacheName)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    )
});
