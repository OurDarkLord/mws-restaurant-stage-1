
/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  static get DATABASE_URL_Reviews() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Create indexdb database
   */
  static createDatabase(callback) { 
    var db = idb.open('restaurants' , 1, function(db) {
      var store = db.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      store.createIndex('by-id', 'id');
      store.createIndex('cuisine', 'cuisine_type');
      store.createIndex('neighborhood', 'neighborhood');
      store.createIndex('is_favorite', 'is_favorite');
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // Retry to send the stored requests
    DBHelper.resendRequests();        

    fetch(DBHelper.DATABASE_URL).then( (res) => {
      if (res.status === 200) { // Got a success response from server!
        res.json().then((restaurants) => {
          var db = idb.open('restaurants' , 1);
          db.then((db) => {
            var tx = db.transaction('restaurants', 'readwrite');
            var store = tx.objectStore('restaurants');
            restaurants.forEach(element => {
              store.put(element);
            });
            return callback(null,restaurants);
          });
        });
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${res.status}`);
        return callback(error, null);
      } 
      }).catch((error) => { callback(`Request failed. Returned status of ${error}`, null); });
  }

  static fetchReviewsOfRestaurant(id, callback) {
    // Retry to send the stored requests
    DBHelper.resendRequests();        

    fetch(`${DBHelper.DATABASE_URL_Reviews}/?restaurant_id=${id}`).then( (res) => {
      if (res.status === 200) {
        res.json().then((reviews) => {
          return callback(null,reviews);
        });
      }
      else {
        const error = (`Request failed. Returned status of ${res.status}`);
        return callback(error, null);
      }
    }).catch((error) => { callback(`Request failed. Returned status of ${error}`, null); });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    id = parseInt(id);
    let open = idb.open("restaurants", 1);
    open.then((db) => {
      let tx = db.transaction('restaurants', 'readonly');
      let keyValStore = tx.objectStore('restaurants');
      return keyValStore.get(id);
    }).then((val, error) => {
      if (error) {
        callback(error, null);
      } else {
        if (val) { // Got the restaurant
          callback(null, val);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    let open = idb.open("restaurants", 1);
    open.then((db) => {
      let tx = db.transaction('restaurants');
      let keyValStore = tx.objectStore('restaurants', 'readonly');
      let cuisineIndex = keyValStore.index('cuisine');
      return cuisineIndex.getAll(cuisine);
    }).then((data, error) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, data);
      }
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    let open = idb.open("restaurants", 1);
    open.then((db) => {
      let tx = db.transaction('restaurants');
      let keyValStore = tx.objectStore('restaurants', 'readonly');
      let neighborhoodIndex = keyValStore.index('neighborhood');
      return neighborhoodIndex.getAll(neighborhood);
    }).then((data, error) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, data);
      }
    }).catch((error) => {
      callback(error, null);
    });
  }

   /**
   * Fetch restaurants by a favorite with proper error handling.
   */
  static fetchRestaurantByfavorite(callback) {
    // Fetch all restaurants
    let open = idb.open("restaurants", 1);
    open.then((db) => {
      let tx = db.transaction('restaurants');
      let keyValStore = tx.objectStore('restaurants', 'readonly');
      let favoriteIndex = keyValStore.index('is_favorite');
      return favoriteIndex.getAll("true");
    }).then((data, error) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, data);
      }
    }).catch((error) => {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    let filteredRestaurants = [];
    let open = idb.open('restaurants', 1);
    open.then((db) => {
      let tx = db.transaction('restaurants');
      let keyValStore = tx.objectStore('restaurants', 'readonly');
      let neighborhoodIndex = keyValStore.index('cuisine');
      return neighborhoodIndex.openCursor();
    }).then(function listRestaurants(cursor) {
      if (!cursor) return; 

      if (cuisine != 'all' && 
        neighborhood != 'all' && 
        cursor.value.neighborhood == neighborhood && 
        cursor.value.cuisine_type == cuisine) { // filter on all parameters
          filteredRestaurants.push(cursor.value);
      }
      else if (cuisine != 'all' && 
        neighborhood == 'all' && 
        cursor.value.cuisine_type == cuisine) { // filter by cuisine
          filteredRestaurants.push(cursor.value);
      }
      else if (cuisine == 'all' && 
        neighborhood != 'all' && 
        cursor.value.neighborhood == neighborhood) { // filter by neighborhood
          filteredRestaurants.push(cursor.value);
      } else if (cuisine == 'all' && neighborhood == 'all') {
        filteredRestaurants.push(cursor.value);
      }
      return cursor.continue().then(listRestaurants);
    }).then(() => {
      callback(null, filteredRestaurants);
    })
    .catch((error) => {
      callback(error, null);
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
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
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
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
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
    return restaurant.photograph ? (`/img/${restaurant.photograph}`) : null;
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
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * Set the restaurant as favorite
  */
  static setFavorite(restaurant) {
    let url = `http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`;

    //the http request way

    // var xhttp = new XMLHttpRequest();
    // xhttp.open("PUT", `http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`);
    //   xhttp.onreadystatechange = function() {
    //     if (this.status == 200) {
    //       console.log('restaurantfavourited is updated !');
    //     } else {
    //       console.log("Failed to favourited the restaurant.");
    //     }
    //   };
    // xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    // xhttp.send();

    // the fetch way
    // Update the local db
    var db = idb.open('restaurants' , 1);
      db.then((db) => {
        var tx = db.transaction('restaurants', 'readwrite');
        let keyValStore = tx.objectStore('restaurants');
        var request = keyValStore.put(restaurant);
        request.onsuccess = function(){
          console.log('restaurant updated!');
        };
        request.onerror = function(error){
          console.log('Error updating: '+ error);
        };
      });

    fetch(url, {
      method: 'put'
    }).then(function(res) {
      if (res.status == 200) {
        DBHelper.setStatusCode(true, 'restaurant marked succesfully.');
      } else {
        DBHelper.setStatusCode(false, 'Failed to send the mark to the server.');
        localStorage.setItem( url, 'put' );
      }
    }).catch( function () {
      DBHelper.setStatusCode(false, 'Failed to send the mark to the server.');
      localStorage.setItem( url, 'put' );
    });
  }

  /*
  * Post the review of the restaurant.
  */
  static postReview(review, callback) {
    var url = 'http://localhost:1337/reviews';
    var bodyReq =  JSON.stringify(review);
    fetch(url, {
      method: 'post',
      body: bodyReq
    }).then(function(res) {
      if (res.status == 201) {
        DBHelper.setStatusCode(true, 'Review succesfully posted.');
        callback(true);
      } else {
        DBHelper.setStatusCode(false, 'Failed to send the review to the server.');
        localStorage.setItem( url, bodyReq );
        callback(false);
      }
    }).catch( function () {
      DBHelper.setStatusCode(false, 'Failed to send the review to the server.');
      localStorage.setItem( url, bodyReq );
      callback(false);
    });
  }
  
  /*
  * Set the status message on the webpage.
  */
  static setStatusCode (status, message) {
    const statusMessage = document.querySelector('#statusMessage');
    statusMessage.innerHTML = '';
    let messagediv = document.createElement('div');
    let title = document.createElement('h3');
    if (status == true) {
      title.innerHTML = message;
      messagediv.classList.add('success');
      messagediv.appendChild(title);
    } else {
      title.innerHTML = message;
      let resendButton = document.createElement('button');
      resendButton.innerHTML = 'resend';
      resendButton.onclick = function() { DBHelper.resendRequests(); };
      messagediv.classList.add('failed');
      messagediv.appendChild(title);
      messagediv.appendChild(resendButton);
    }
    statusMessage.appendChild(messagediv);
    statusMessage.classList.add('active');
  
    if(status == true) {
      setTimeout( function() {
        statusMessage.classList.remove('active');
      }, 3000);
    }
  };

  /*
  * Retry to send the failed requests.
  */
  static resendRequests () {
    if ( 0 < localStorage.length){
      var key = localStorage.key(0);
      if (localStorage.getItem(key) == 'put') {
        fetch(key, {
          method: 'put',
        }).then(function(res) {
          if (res.status == 200) {
            DBHelper.setStatusCode(true, 'Review successfully posted.');
            localStorage.removeItem(key);
            DBHelper.resendRequests();
          } else {
            DBHelper.setStatusCode(false, 'Failed to send the mark to the server.');
          }
        }).catch( function () {
          DBHelper.setStatusCode(false, 'Failed to send the mark to the server.');
        });
      } else {
        fetch(key, {
          method: 'post',
          body: localStorage.getItem(key)
        }).then(function(res) {
          if (res.status == 201) {
            DBHelper.setStatusCode(true, 'Review successfully posted.');
            localStorage.removeItem(key);
            DBHelper.resendRequests();
          } else {
            DBHelper.setStatusCode(false, 'Failed to send the review to the server.');
          }
        }).catch( function () {
          DBHelper.setStatusCode(false, 'Failed to send the review to the server.');
        });
      }
    }
  }
}

/**
 * Registration of the service worker.
 */
if(navigator.serviceWorker){
  navigator.serviceWorker.register('./sw.js').then(function(reg){
      console.log('registerd to the SW');
    }).catch(function(err){
      console.log("can't register to the service worker.", err);
  });
}

