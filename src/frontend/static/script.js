document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map centered on a default location
    var map = L.map('map').setView([-25.7479, 28.2293], 12); // Default to Pretoria

    // Load the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            map.setView([lat, lon], 14); // Adjust zoom level

            // Remove existing markers before adding a new one
            map.eachLayer(function (layer) {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // Add a marker for the user's location
            L.marker([lat, lon]).addTo(map)
                .bindPopup("You are here")
                .openPopup();

            // Call the function to calculate the distance when a destination is entered
            document.getElementById('destination-input').addEventListener('input', function() {
                const destination = this.value;
                if (destination) {
                    getPlaceSuggestions(destination);
                } else {
                    clearSuggestions();
                }
            });
        }, function (error) {
            console.error("Error retrieving location:", error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }

    // Function to get place suggestions using OpenStreetMap's Nominatim API
    function getPlaceSuggestions(query) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
            .then(response => response.json())
            .then(data => {
                clearSuggestions(); // Clear existing suggestions
                if (data.length > 0) {
                    displaySuggestions(data);
                }
            })
            .catch(error => {
                console.error('Error fetching place suggestions:', error);
            });
    }

    // Function to display suggestions in a dropdown
    function displaySuggestions(suggestions) {
        const suggestionList = document.getElementById('suggestion-list');
        suggestions.forEach(suggestion => {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion.display_name;
            listItem.addEventListener('click', function() {
                document.getElementById('destination-input').value = suggestion.display_name;
                calculateDistanceToDestination(suggestion.lat, suggestion.lon);
                clearSuggestions();
            });
            suggestionList.appendChild(listItem);
        });
    }

    // Function to clear suggestions
    function clearSuggestions() {
        const suggestionList = document.getElementById('suggestion-list');
        suggestionList.innerHTML = ''; // Clear the suggestion list
    }

    // Function to calculate the distance using the Haversine formula
    function calculateDistanceToDestination(destLat, destLon) {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(function(position) {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            const distance = calculateDistance(userLat, userLon, destLat, destLon);
            document.getElementById('distance-result').textContent = `Distance to destination: ${distance.toFixed(2)} km`;
        });
    }

    // Function to calculate the distance using the Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }

    // Function to convert degrees to radians
    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Button Click Handlers
    document.getElementById('search-btn').addEventListener('click', function() {
        const destination = document.getElementById('destination-input').value;
        if (destination) {
            getPlaceSuggestions(destination);
        }
    });

    document.getElementById('distance-btn').addEventListener('click', function() {
        const destination = document.getElementById('destination-input').value;
        if (destination) {
            getPlaceSuggestions(destination);
        }
    });
});

// Handle Login Form Submission
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
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
            window.location.href = "/user_home";  // Redirect to user home
        } else {
            document.getElementById('login-error').innerText = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('login-error').innerText = 'An error occurred. Please try again later.';
    });
});

// Handle Signup Form Submission
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
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
            window.location.href = "/user_home";  // Redirect after successful signup
        } else {
            document.getElementById('signup-error').innerText = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('signup-error').innerText = 'An error occurred. Please try again later.';
    });
});
