
let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  createDatabase();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Create a database
 */
var createDatabase = () => {
  DBHelper.createDatabase((error) => {
    if (error) { // Got an error
      console.error(error);
    }
  });
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
var fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
var fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute("role", "option"); 
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
var fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
var fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute("role", "option"); 
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
var updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const favorite = document.getElementById('favoriteFilter').checked;

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  // If only favorite is checked, get favorite restaurants.
  if (cuisine == 'all' && neighborhood == 'all' && favorite) {
    DBHelper.fetchRestaurantByfavorite((error, restaurants) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    });
  } else {
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        // If the favorite filter is enabled, check on favorite.
        if ( favorite ) {
          let filteredFavoriteRestaurants = [];
          restaurants.forEach(restaurant => {
            if ( restaurant.is_favorite == "true") {
              filteredFavoriteRestaurants.push(restaurant);
            }
          });
          restaurants = filteredFavoriteRestaurants;
        }
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
        
      }
    });
  }
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
var resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
var fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
var createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const restaurantImg = DBHelper.imageUrlForRestaurant(restaurant);
  if (restaurantImg) {
    const pictureTag = document.createElement('picture');
    const sourceWebP = document.createElement('source');
    const sourceJpg = document.createElement('source');
    const image = document.createElement('img');
    sourceWebP.srcset = `${restaurantImg}.webp`;
    sourceJpg.srcset = `${restaurantImg}.jpg`;
    image.className = 'restaurant-img';
    image.alt = "An image from the restaurant " + restaurant.name;
    image.src = `${restaurantImg}.jpg`;
    pictureTag.append(sourceWebP);
    pictureTag.append(sourceJpg);
    pictureTag.append(image);
    li.append(pictureTag);

  }
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', 'Details of ' + restaurant.name);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
var addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
