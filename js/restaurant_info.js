let restaurant;
var map;
var postReviewQueue = [];
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
  const radioButtons = document.querySelectorAll('.postRating');
  const commentpost = document.querySelector('#postComment').value;
  let ratingpost; 
  radioButtons.forEach(function(radiobutton) {
    if ( radiobutton.checked ) {
      ratingpost = radiobutton.value;
      return;
    }
  });
  const datepost = new Date();

  let review = {
    name: namepost,
    date: datepost.getTime(),
    rating: ratingpost,
    comments: commentpost
  };
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
  
  
  const poststring = `restaurant_id=${self.restaurant.id}&name=${namepost}&rating=${ratingpost}&comments=${commentpost}`;
  postReviewQueue.push(poststring);
  sendPostReview();
};


sendPostReview = () => {
  failedPostReviewQueue = [];
  postReviewQueue.forEach(function(postString) {
    let done = false;
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "http://localhost:1337/reviews");
    xhttp.onreadystatechange = function() {
      if (this.status == 201) {
        if (!done){
          fetchReviews();
          done = true;
          setStatusCode(true, "Review succesfully posted.");
        }
      } else {
        failedPostReviewQueue.push(postString);
        setStatusCode(false, "Failed to send the review to the server.");
      }
    };

    //for sending json
    // xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  
    // xhttp.send(JSON.stringify({ 
    //   restaurant_id: self.restaurant.id,
    //   name: name,
    //   rating: rating,
    //   comments: comment
    // }));
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send(postString);
  });
  postReviewQueue = failedPostReviewQueue;
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
setStatusCode = (status, message) => {
  const statusMessage = document.querySelector('#statusMessage');
  statusMessage.innerHTML = '';
  messagediv = document.createElement('div');
  let title = document.createElement('h3');
  if (status == true) {
    title.innerHTML = `Review posted!`;
    messagediv.classList.add("success");
    messagediv.appendChild(title);
  } else {
    title.innerHTML = `You're offline! Resend it to the server.`;
    let resendButton = document.createElement('button');
    resendButton.innerHTML = 'resend';
    resendButton.onclick = function() { sendPostReview(); };
    messagediv.classList.add("failed");
    messagediv.appendChild(title);
    messagediv.appendChild(resendButton);
  }
  statusMessage.appendChild(messagediv);
  statusMessage.classList.add("active");

  if(status == true) {
    setTimeout( function() {
      statusMessage.classList.remove("active");
    }, 3000);
  }

};
