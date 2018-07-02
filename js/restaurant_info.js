let restaurant;
var map;
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

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
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
  address.innerHTML = restaurant.address;

  const pictureTag = document.getElementById('restaurant-img');
  const img_url = DBHelper.imageUrlForRestaurant(restaurant);
  if (img_url) {

    pictureTag.className = 'restaurant-img';
    const sourceWebP = document.createElement('source');
    const sourceJpg = document.createElement('source');
    const image = document.createElement('img');
    sourceWebP.srcset = `${img_url}.webp`;
    sourceJpg.srcset = `${img_url}.jpg`;
    image.alt = "An image from the restaurant " + restaurant.name;
    image.src = `${img_url}.jpg`;
    pictureTag.append(sourceWebP);
    pictureTag.append(sourceJpg);
    pictureTag.append(image);

  } else {
    pictureTag.remove();
  }

  setFavoriteIcon();
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // Fetch Reviews
  fetchReviews();
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

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  container.innerHTML = '';
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.id = 'reviews-list-header';
  container.appendChild(title);
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.id = "noReviewsMessage";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.createElement('ul');
  ul.id = "reviews-list";
  
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabIndex = 0;
  li.setAttribute('aria-labelledby', 'reviews-list');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  let convertedDate = new Date(review.createdAt);
  date.innerHTML = `${convertedDate.getDate()} / ${convertedDate.getMonth()+1} / ${convertedDate.getFullYear()}`;
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
fillBreadcrumb = (restaurant=self.restaurant) => {
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
};

postReview = () => {
  const namepost = document.querySelector('#postName').value;
  let radioButtons = document.querySelectorAll('.postRating');
  const commentpost = document.querySelector('#postComment').value;
 
  // Clear the boxes.
  document.querySelector('#postName').value = "";
  document.querySelector('#postComment').value = "";

  let ratingpost; 
  radioButtons.forEach(function(radiobutton) {
    if ( radiobutton.checked ) {
      ratingpost = radiobutton.value;
      radiobutton.checked = false;
      return;
    }
  });
  const datepost = new Date();

  let review = {
    restaurant_id: self.restaurant.id,
    name: namepost,
    createdAt: datepost.getTime(),
    rating: ratingpost,
    comments: commentpost
  };

  // Append the review to the list.
  let reviewList = document.querySelector('#reviews-list');
  if (reviewList) {
    reviewList.appendChild(createReviewHTML(review));
  } else {
    const container = document.getElementById('reviews-container');
    const ul = document.createElement('ul');
    ul.id = "reviews-list";
    ul.appendChild(createReviewHTML(review));
    container.appendChild(ul);
    let noReviewsMessage = document.querySelector('#noReviewsMessage');
    noReviewsMessage.remove();
  }

  // Make the call to the server and update the reviews.
  DBHelper.postReview(review, (status) => {
    // If the fetch is success, update all the reviews.
    if(status) fetchReviews();
  });
};

/*
* Get the reviews of the restaurant
*/
fetchReviews = (id =self.restaurant.id) => {
  DBHelper.fetchReviewsOfRestaurant(id, (error, review) => {
    if (!review) {
      console.error(error);
      return;
    }
    self.restaurant.reviews = review;
     // fill reviews
    fillReviewsHTML();
  });
};

/*
* Set status
*/
document.getElementById('favorite').addEventListener("click", function(){

  if(restaurant.is_favorite === "true") { 
    self.restaurant.is_favorite = "false";
  } else {
    self.restaurant.is_favorite = "true";
  }

  DBHelper.setFavorite(self.restaurant);

  setFavoriteIcon();
});

/*
* Set favourite icon
*/
setFavoriteIcon = () => {
  if(restaurant.is_favorite === "true") {
    document.getElementById('favorite').setAttribute("fill", "#ffe900");
  } else {
    document.getElementById('favorite').setAttribute("fill", "#919191");
  }
};
