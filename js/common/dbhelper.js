
import idb from 'idb';
/**
 * Common database helper functions.
 */


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  var DATABASE_URL = () => {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  function  fetchRestaurants(callback) {
    fetch(DATABASE_URL).then( (res) => {
      if (res.status === 200) { // Got a success response from server!
        res.json().then( (restaurants) => {
          idb.open('restaurants' , 1, function(db) {
            var store = db.createObjectStore('restaurants', {
              keyPath: 'id'
            });
            store.createIndex('by-id', 'id');
          }).then( (db) => {
            var tx = db.transaction('restaurants', 'readwrite');
            var store = tx.objectStore('restaurants');
            restaurants.array.forEach(element => {
              store.put(element);
            });
          });
        });
        return callback(null, res.json());
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${res.status}`);
        return callback(error, null);
      } 
    }).catch( (err) => callback(`Request failed. Returned status of ${err}`, null) )
    ;
  }

  /**
   * Fetch a restaurant by its ID.
   */
  function  fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        restaurants.then( res => {
          const restaurant = res.find(r => r.id == id);
          if (restaurant) { // Got the restaurant
            callback(null, restaurant);
          } else { // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        });
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  function  fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  function  fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  function  fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        restaurants.then( results => {
          console.log(results);
          if (cuisine != 'all') { // filter by cuisine
            results = results.filter(r => r.cuisine_type == cuisine);
          }
          if (neighborhood != 'all') { // filter by neighborhood
            results = results.filter(r => r.neighborhood == neighborhood);
          }
          callback(null, results);
        }); 
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  function  fetchNeighborhoods(callback) {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        restaurants.then( (restaurants) => {
          const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
          // Remove duplicates from neighborhoods
          const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
          callback(null, uniqueNeighborhoods);
        });
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  function  fetchCuisines(callback) {
    // Fetch all restaurants
    fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        restaurants.then( (restaurants) => {
          const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
          // Remove duplicates from cuisines
          const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
          callback(null, uniqueCuisines);
        });
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  function  urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  function  imageUrlForRestaurant(restaurant) {
    return restaurant.photograph ? (`/img/${restaurant.photograph}.jpg`) : null;
  }

  /**
   * Map marker for a restaurant.
   */
  function mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }


