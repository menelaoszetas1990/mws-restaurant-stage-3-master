let restaurant;
let restaurantId;
var map;
let reviewsGlobal;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
};

window.addEventListener('online', () => {
    console.log('back online');
    DBHelper.sendOfflineData();
    let offlineReview = document.getElementById('reviews-offline-item');
    offlineReview.setAttribute('id', 'reviews-list');
});

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) {
        // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        let error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        restaurantId = id;
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
        DBHelper.fetchReviewsById(restaurantId, (reviews) => {
            reviewsGlobal = reviews;
            fillReviewsHTML(reviewsGlobal);
            return;
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.setAttribute('aria-label', 'Restaurant address' + restaurant.address);
    address.setAttribute('tabindex', "0");
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';

    if (image.offsetWidth < 450) {
        image.setAttribute('srcset', `/images/${restaurant.id}-450_small.jpg`);
    }
    else {
        image.setAttribute('srcset', `/images/${restaurant.id}-600_medium.jpg`);
    }

    image.setAttribute('src', DBHelper.imageUrlForRestaurant(restaurant));
    image.setAttribute('alt', restaurant.name + 'restaurant image');
    image.setAttribute('tabindex', "0");

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.setAttribute('aria-label', 'cuisine' + restaurant.cuisine_type);
    cuisine.setAttribute('tabindex', "0");
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        row.setAttribute('tabindex', "0");

        hours.appendChild(row);
    }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.setAttribute('aria-label', 'Reviews');
    title.setAttribute('tabindex', '0');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    console.log(review);

    const li = document.createElement('li');
    li.setAttribute('tabindex', '0');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    if (review.date)
        date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// post review
postReview = () => {
    event.preventDefault();
    let review = getFormData();

    if (navigator.onLine) {
        DBHelper.addReview(review);
        let container = document.getElementById('reviews-container');
        const reviews = document.createElement('ul');
        reviews.setAttribute('id', 'reviews-list');

        reviews.appendChild(createReviewHTML(review));

        const titleReviews = container.getElementsByTagName('h3');
        container.insertBefore(reviews, titleReviews.nextSibling);

        document.forms["reviewForm"].reset();
    }
    else {
        DBHelper.setOfflineReview(JSON.stringify(review));
        alert('You are offline. Review will be submitted when online.');
        let container = document.getElementById('reviews-container');
        const reviews = document.createElement('ul');
        reviews.setAttribute('id', 'reviews-offline-item');

        reviews.appendChild(createReviewHTML(review));

        const titleReviews = container.getElementsByTagName('h3');
        container.insertBefore(reviews, titleReviews.nextSibling);

        document.forms["reviewForm"].reset();
    }
};

getFormData = () => {
    const name = document.getElementById("name").value;
    const stars = document.getElementsByName("star");
    const comments = document.getElementById("comments").value;

    let rating = 0;
    for (let i = 0; i < 5; i++) {
        if (stars[i].checked) {
            rating = parseInt(stars[i].value);
        }
    }

    return {
        restaurant_id: parseInt(restaurantId),
        name: name,
        rating: rating,
        comments: comments,
        date: new Date()
    };
};