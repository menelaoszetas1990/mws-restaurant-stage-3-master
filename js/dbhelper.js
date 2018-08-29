/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        return `http://localhost:1337/restaurants`;
    }

    static createIndexDB() {
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }

        return idb.open('restaurants_db', 2, (upgradeDb) =>  {
            switch(upgradeDb.oldVersion) {
                case 0:
                    const restaurantsStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
                case 1:
                    // const reviewsStore = upgradeDb.createObjectStore('reviews', {keyPath: 'restaurant_id'});
                    const reviewsStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
            }
        });
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        // let url;
        // if (!id)
        //     url = DBHelper.DATABASE_URL;
        // else
        //     url = DBHelper.DATABASE_URL + "/" + id;

        var restaurants = [];

        let dbPromise = this.createIndexDB();

        dbPromise.then(db => {
            let tx_read = db.transaction('restaurants');
            let restaurantsObjStore = tx_read.objectStore('restaurants');
            return restaurantsObjStore.getAll() || restaurants;
        }).then(async function(allRestaurants){
            if (!allRestaurants || allRestaurants.length === 0) {
                let response = await fetch(DBHelper.DATABASE_URL);
                allRestaurants = await response.json();

                dbPromise.then(db => {
                    let tx_write = db.transaction('restaurants', 'readwrite');
                    let restaurantsObjStore = tx_write.objectStore('restaurants');
                    allRestaurants.forEach(restaurant => restaurantsObjStore.put(restaurant));
                });
            }
            return allRestaurants;
        }).then(function(response){
            return response;
        }).then(restaurants => {
            callback(null, restaurants);
        }).catch(e => {
            callback(e, null);
        })
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id.toString() === id);
                if (restaurant) { // Got the restaurant
                    console.log(restaurant);
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type === cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood === neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine !== 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type === cuisine);
                }
                if (neighborhood !== 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood === neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/images/${restaurant.id}-800_large.jpg`);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
                position: restaurant.latlng,
                title: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant),
                map: map,
                animation: google.maps.Animation.DROP
            }
        );
        return marker;
    }

    static addReview(review){
        const headers = new Headers({'Content-Type': 'application/json'});
        const body = JSON.stringify(review);
        let options = {
            method: 'POST',
            mode: 'cors',
            cache: "no-cache",
            credentials: 'same-origin',
            headers: headers,
            body: body
        };
        this.serverConnection('http://localhost:1337/reviews/', options)
            .then((data) => {
                this.fetchReviewsById(data.restaurant_id);
            })
            .catch(error => {
                console.log('Fail to add review: ', error.message);
            });
    }

    static setOfflineReview(review) {
        localStorage.setItem('offlineReview', review);
    }

    static sendOfflineData() {
        const  offlineReview = JSON.parse(localStorage.getItem('offlineReview'));

        if (localStorage.length) {
            this.addReview(offlineReview);
            localStorage.clear();
        }
    }

    static serverConnection(url,options) {
        return fetch(url, options).then(response => {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        });
    }

    static fetchReviewsById(id, callback){
        const options = {
            credentials: 'include'
        };
        const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
        let dbPromise = this.createIndexDB();

        this.serverConnection(url, options)
            .then(reviews => {
                dbPromise.then((db) => {
                        if (!db) return;

                        let tx = db.transaction('reviews', 'readwrite');
                        let reviewsObjStore = tx.objectStore('reviews');

                        if (Array.isArray(reviews)){
                            console.log('reviews', reviews);
                            reviews.forEach(review => {
                                reviewsObjStore.put(review);
                            });
                        }else {
                            reviewsObjStore.put(reviews);
                        }

                        callback(reviews);
                    });
            })
            .catch((error) => {
                    return dbPromise.then((db) => {
                        if (!db) return;

                        let tx = db.transaction('reviews', 'readonly');
                        let reviewsObjStore = tx.objectStore('reviews');

                        return Promise.resolve(reviewsObjStore.getAll())
                            .then((reviews) => {
                                let restaurantReviews = [];
                                reviews.forEach(review => {
                                    if (review.restaurant_id.toString() === id) {
                                        restaurantReviews.push(review);
                                    }
                                });
                                callback(restaurantReviews);
                            })
                    });
            });
    }
}

window.DBHelper = DBHelper;