// Initialize Google Map and setup user location tracking
function initMap() {
    console.log("Google Map initialized");
    let map;
    let userMarker;
    let autocomplete;

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -25.7479, lng: 28.2293 }, // Default to Pretoria
        zoom: 12
    });

    // Check if the browser supports geolocation
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(position => {
            const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            localStorage.setItem('userCoordinates', JSON.stringify(userLocation));

            // Create a marker for the user's location if it doesn't exist
            if (!userMarker) {
                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "You are here"
                });
            } else {
                userMarker.setPosition(userLocation);
            }

            // Center the map on the user's location
            map.setCenter(userLocation);
        }, error => console.error("Location error:", error));
    }

    // Initialize Google Places Autocomplete for destination input
    initAutocomplete();
}

// Initialize Google Places Autocomplete for destination input
function initAutocomplete() {
    const input = document.getElementById('destination-input');
    autocomplete = new google.maps.places.Autocomplete(input);

    // Listen for a place selection
    autocomplete.addListener('place_changed', function () {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            calculateDistanceToDestination(place.geometry.location.lat(), place.geometry.location.lng());
        }
    });

    // Listen for input changes to provide suggestions
    input.addEventListener('input', function () {
        const value = input.value;
        if (value) {
            getPlaceSuggestions(value);
        } else {
            clearSuggestions();
        }
    });
}

/**
 * Fetches place suggestions based on the user's input.
 * 
 * @param {string} input - The user's input.
 */
function getPlaceSuggestions(input) {
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: input }, function (predictions, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            displaySuggestions(predictions);
        }
    });
}

/**
 * Displays place suggestions in the suggestion list.
 * 
 * @param {Array} predictions - The place predictions.
 */
function displaySuggestions(predictions) {
    const suggestionList = document.getElementById('suggestion-list');
    suggestionList.innerHTML = '';
    predictions.forEach(prediction => {
        const li = document.createElement('li');
        li.textContent = prediction.description;
        li.addEventListener('click', function () {
            document.getElementById('destination-input').value = prediction.description;
            clearSuggestions();
        });
        suggestionList.appendChild(li);
    });
}

/**
 * Clears the suggestion list.
 */
function clearSuggestions() {
    const suggestionList = document.getElementById('suggestion-list');
    suggestionList.innerHTML = '';
}

/**
 * Calculates the distance between the user's current location and the selected destination.
 * 
 * @param {number} destLat - Latitude of the destination.
 * @param {number} destLon - Longitude of the destination.
 */
function calculateDistanceToDestination(destLat, destLon) {
    const userCoords = JSON.parse(localStorage.getItem('userCoordinates'));
    if (!userCoords) return;

    // Compute the distance using the Haversine formula
    const distance = calculateDistance(userCoords.lat, userCoords.lng, destLat, destLon);
    document.getElementById('distance-result').textContent = `Distance: ${distance.toFixed(2)} km`;

    // Draw a line from user location to destination
    new google.maps.Polyline({
        path: [userCoords, { lat: destLat, lng: destLon }],
        geodesic: true,
        strokeColor: "#0000FF",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: map
    });
}

/**
 * Uses the Haversine formula to calculate the great-circle distance between two points.
 * 
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} Distance in kilometers.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Converts degrees to radians.
 * 
 * @param {number} deg - Angle in degrees.
 * @returns {number} Angle in radians.
 */
function toRad(deg) { return deg * (Math.PI / 180); }

// Expose initialization functions globally for Google Maps API callback
window.initMap = initMap;
window.initAutocomplete = initAutocomplete;

// Button Click Handlers
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");

    // Check if the button exists before adding event listener
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const destination = document.getElementById('destination-input').value;
            console.log("Search button clicked, destination:", destination);
            if (destination) {
                getPlaceSuggestions(destination);
            }
            clearSuggestions();
        });
    } else {
        console.error("Search button not found");
    }



    // Handle Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log("Login form submitted");

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ email: email, password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Login successful");
                    window.location.href = "/user_home";  // Redirect to user home
                } else {
                    console.log("Login failed:", data.message);
                    document.getElementById('login-error').innerText = data.message;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('login-error').innerText = 'An error occurred. Please try again later.';
            });
        });
    }

    // Handle Signup Form Submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log("Signup form submitted");

            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password !== confirmPassword) {
                console.log("Passwords do not match");
                document.getElementById('signup-error').innerText = 'Passwords do not match.';
                return;
            }

            fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ name, email, phone, password, confirm_password: confirmPassword })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Signup successful");
                    window.location.href = "/user_home";  // Redirect after successful signup
                } else {
                    console.log("Signup failed:", data.message);
                    document.getElementById('signup-error').innerText = data.message;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('signup-error').innerText = 'An error occurred. Please try again later.';
            });
        });
    }
});
