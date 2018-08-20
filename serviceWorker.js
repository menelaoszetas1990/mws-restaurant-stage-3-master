importScripts('/js/idb.js');

let staticCacheName = 'project';

self.addEventListener('install', (event) => {
    console.log('start sw');
    event.waitUntil(
        caches.open(staticCacheName)
            .then((cache) => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/restaurant.html',
                    '/manifest.json',
                    '/css/styles.css',
                    '/images/1-450_small.jpg', '/images/1-600_medium.jpg', '/images/1-800_large.jpg',
                    '/images/2-450_small.jpg', '/images/2-600_medium.jpg', '/images/2-800_large.jpg',
                    '/images/3-450_small.jpg', '/images/3-600_medium.jpg', '/images/3-800_large.jpg',
                    '/images/4-450_small.jpg', '/images/4-600_medium.jpg', '/images/4-800_large.jpg',
                    '/images/5-450_small.jpg', '/images/5-600_medium.jpg', '/images/5-800_large.jpg',
                    '/images/6-450_small.jpg', '/images/6-600_medium.jpg', '/images/6-800_large.jpg',
                    '/images/7-450_small.jpg', '/images/7-600_medium.jpg', '/images/7-800_large.jpg',
                    '/images/8-450_small.jpg', '/images/8-600_medium.jpg', '/images/8-800_large.jpg',
                    '/images/9-450_small.jpg', '/images/9-600_medium.jpg', '/images/9-800_large.jpg',
                    '/images/10-450_small.jpg', '/images/10-600_medium.jpg', '/images/10-800_large.jpg',
                    '/js/main.js',
                    '/js/dbhelper.js',
                    '/js/restaurant_info.js',
                    '/js/idb.js'
                ])
            })
    )
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {

                var fromNetwork = fetch(event.request).then(fetchFromNetwork, fetchFailed).catch(fetchFailed);

                return response || fromNetwork;

                function fetchFromNetwork(response) {
                    var responseClone = response.clone();

                    caches.open(staticCacheName).then(function add(cache) {

                        cache.put(event.request, responseClone);

                        event.request.json().then(responseJson => {

                            dbPromise.then(function (db) {
                                let tx_write = db.transaction('restraurants', 'readwrite');
                                let restaurantsStore = tx_write.objectStore('restraurants');

                                for (let i = 0; i < responseJson.length; i++) {
                                    restaurantsStore.put(responseJson[i]);
                                }
                            })
                        }).then(responseJson => {
                            console.log("db success for: " + responseJson);
                        }).catch(responseJson => {
                            console.log("db fail for: " + responseJson);
                        })
                    }).then(function () {
                        console.log('Response cached.', event.request.url);
                    });
                }

                function fetchFailed() {
                    console.log('Fetch failed.');

                    return new Response('<h1>No Response</h1>', {
                        status: 404,
                        statusText: 'Resource Not Found',
                        headers: new Headers({'Content-Type': 'text/html'})
                    });
                }

            })
    )
});
