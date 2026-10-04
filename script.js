// 1. Initialize the map
// Coordinates for Edinburgh New Town (approx. George Street area)
// Add { keyboard: false } to disable map panning with arrow keys
var map = L.map('map', {
    center: [55.9533, -3.1950],
    zoom: 15,
    keyboard: false 
});

// 2. Add the base tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// --- Game Boundaries (Edinburgh New Town) ---
var bounds = {
    north: 55.9568,
    south: 55.9482,
    east: -3.1919, 
    west: -3.2098 
};

// --- Fixed Start Positions ---
// Adjust these coordinates to match your desired start spots on the map
var pacmanStart = [55.9540, -3.1950]; // Center area

var ghost1Start = [55.9564, -3.1951]; 
var ghost2Start = [55.9562, -3.2054]; 
var ghost3Start = [55.9501, -3.2054]; 
var ghost4Start = [55.9504, -3.1950]; 

// --- Boundary Check Function ---
function isValidPosition(lat, lng) {
    if (lat > bounds.north || lat < bounds.south) return false;
    if (lng > bounds.east || lng < bounds.west) return false;
    return true;
}

// --- Game Variables ---
var gameActive = false;
var pacmanPosition = [55.9533, -3.1950]; // Start position (adjust as needed)
var pacmanSpeed = 0.00015; // Adjust this to make Pac-Man faster or slower
var pacmanMarker = null;
var ghosts = [];
var collectibles = []; // To store monument markers

// --- Initialize Pac-Man ---
function createPacman() {
    var startPos = pacmanStart; // Use fixed start
    pacmanPosition = startPos;
    
    var pacmanIcon = L.divIcon({
        className: 'pacman-icon',
        html: '<div style="background-color: red; width: 15px; height: 15px; border-radius: 50%; border: 2px solid black;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    pacmanMarker = L.marker(pacmanPosition, {icon: pacmanIcon}).addTo(map);
}

// --- Unified Key Listener (Start + Movement) ---
document.addEventListener('keydown', function(event) {
    
    // 1. HANDLE ENTER KEY (Start/Restart/Win)
    // This must happen BEFORE the gameActive check so it works on start screen
    if (event.key === 'Enter') {
        var winScreen = document.getElementById('win-screen');
        var startScreen = document.getElementById('start-screen');
        var gameOverScreen = document.getElementById('game-over');

        // Check if Win Screen is visible (using getComputedStyle for reliability)
        if (window.getComputedStyle(winScreen).display === 'block') {
            location.reload(); // Restart game
            return; // Stop here
        }

        // Check if Game is Not Active (Start Screen state)
        if (!gameActive) {
            gameActive = true;
            startScreen.style.display = 'none';
            gameOverScreen.style.display = 'none';
            winScreen.style.display = 'none';
            return; // Stop here (don't try to move Pacman)
        }
    }

    // 2. PREVENT MOVEMENT IF GAME NOT ACTIVE
    // Now that Enter is handled, we can block arrow keys if game hasn't started
    if (!gameActive) return;

    // 3. HANDLE ARROW KEYS (Movement)
    // (This is your existing code from the screenshot)
    var newLat = pacmanPosition[0];
    var newLng = pacmanPosition[1];

    switch(event.key) {
        case 'ArrowUp': newLat += pacmanSpeed; break;
        case 'ArrowDown': newLat -= pacmanSpeed; break;
        case 'ArrowLeft': newLng -= pacmanSpeed; break;
        case 'ArrowRight': newLng += pacmanSpeed; break;
    }

    // Only move if the new position is within bounds
    if (isValidPosition(newLat, newLng)) {
        pacmanPosition = [newLat, newLng];
        pacmanMarker.setLatLng(pacmanPosition);
        checkCollisions();
    }
});


// --- Update Inventory UI ---
function addToList(name) {
    var list = document.getElementById('inventory-list');
    var newItem = document.createElement('li');
    newItem.textContent = name;
    list.appendChild(newItem);
}

// --- Collision Detection ---
function checkCollisions() {
    // Check collectibles
    for (var i = collectibles.length - 1; i >= 0; i--) {
        var item = collectibles[i]; // Get the whole object (marker, name, latlng)
        var dotPos = item.latlng;
        
        // Calculate simple distance
        var distance = Math.sqrt(
            Math.pow(pacmanPosition[0] - dotPos.lat, 2) + 
            Math.pow(pacmanPosition[1] - dotPos.lng, 2)
        );

        // If close enough, remove the dot and add to list
        if (distance < 0.0001) {
            map.removeLayer(item.marker); // Remove from map
            addToList(item.name);         // Add name to sidebar
            collectibles.splice(i, 1);    // Remove from array

            // --- CHECK WIN CONDITION ---
            if (collectibles.length === 0) {
                triggerWin();
                return; // Stop checking collisions
        }
    }
    }

    // Check Ghosts (Existing code remains the same)
    ghosts.forEach(function(ghost) {
        var distance = Math.sqrt(
            Math.pow(pacmanPosition[0] - ghost.position[0], 2) + 
            Math.pow(pacmanPosition[1] - ghost.position[1], 2)
        );
        if (distance < 0.00015) {
            triggerGameOver();
        }
    });
}

// --- Game Over Function ---
function triggerGameOver() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
    // Reset game after 2 seconds
    setTimeout(function() {
        location.reload(); // Reloads page, showing Start Screen again
    }, 2000);
}

// --- Win Game Function ---
function triggerWin() {
    gameActive = false; // Stop movement
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('win-screen').style.display = 'block';
}


// --- Ghost Logic ---
function createGhost(lat, lng, color, mode) {
    var ghostIcon = L.divIcon({
    className: 'ghost-icon',
    html: '<span style="font-size: 24px;">🚌</span>', // Bus Emoji
    iconSize: [30, 30], // Slightly larger to fit the emoji
    iconAnchor: [15, 15] // Center the icon
});
    var ghostMarker = L.marker([lat, lng], {icon: ghostIcon}).addTo(map);
    // Store the mode ('chaser' or 'random') with the ghost
    ghosts.push({marker: ghostMarker, position: [lat, lng], mode: mode});
}

// Create 4 ghosts: 2 Chasers (Red, Cyan) and 2 Random (Pink, Orange)
// Create 4 ghosts with fixed start positions
createGhost(ghost1Start[0], ghost1Start[1], 'red', 'chaser');
createGhost(ghost2Start[0], ghost2Start[1], 'cyan', 'chaser');
createGhost(ghost3Start[0], ghost3Start[1], 'pink', 'random');
createGhost(ghost4Start[0], ghost4Start[1], 'orange', 'random');

// Move ghosts every 200ms
setInterval(function() {
    // Prevent movement if game hasn't started
    if (!gameActive) return;

    ghosts.forEach(function(ghost) {
        // --- Speed Logic ---
        var step;
        if (ghost.mode === 'chaser') {
            step = pacmanSpeed * 0.1;
        } else {
            step = pacmanSpeed * 2.5;
        }

        var newLat = ghost.position[0];
        var newLng = ghost.position[1];

        // --- Calculate Proposed Move ---
        if (ghost.mode === 'chaser') {
            if (pacmanPosition[0] > ghost.position[0]) newLat += step;
            else newLat -= step;
            
            if (pacmanPosition[1] > ghost.position[1]) newLng += step;
            else newLng -= step;
        } else {
            var move = Math.random();
            if (move < 0.25) newLat += step;
            else if (move < 0.5) newLat -= step;
            else if (move < 0.75) newLng += step;
            else newLng -= step;
        }

        // --- Strict Boundary Check ---
        // Only update Latitude if within North/South bounds
        if (newLat <= bounds.north && newLat >= bounds.south) {
            ghost.position[0] = newLat;
        }
        
        // Only update Longitude if within East/West bounds
        if (newLng <= bounds.east && newLng >= bounds.west) {
            ghost.position[1] = newLng;
        }
        
        ghost.marker.setLatLng(ghost.position);
    });
}, 200);


// 3. Function to load GeoJSON files
function loadGeoJSON(url, styleOptions) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function(feature) {
                    return styleOptions;
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
}

// --- Updated Function to load Points (Monuments) ---
function loadGeoJSONPoints(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    var marker = L.circleMarker(latlng, {
                        color: '#fbff00',
                        radius: 8,
                        fillColor: '#fbff00',
                        fillOpacity: 1,
                        weight: 1
                    });
                    
                    // Extract name from properties (fallback to 'Unknown Monument' if missing)
                    var monumentName = feature.properties.name || "Unknown Monument";
                    
                    // Store marker, name, and latlng in collectibles array
                    collectibles.push({ 
                        marker: marker, 
                        name: monumentName, 
                        latlng: latlng 
                    });
                    
                    return marker;
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading points:', error));
}

// 5. Load your data layers
// IMPORTANT: Ensure these filenames match exactly what is in your 'data' folder
loadGeoJSON('data/roads2.json', {
    color: '#6e6d6d',
    weight: 3,
    opacity: 0.8
});

loadGeoJSON('data/buildings.json', {
    color: '#4b4b4b',
    weight: 1,
    fillOpacity: 0.5
});

loadGeoJSONPoints('data/monuments.json', {
    color: '#fbff00',
    radius: 8,
    fillOpacity: 1
});

createPacman()

// --- Start/Restart Game Listener ---
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        // Check if Win Screen is visible
        if (document.getElementById('win-screen').style.display === 'block') {
            location.reload(); // Restart game
        } 
        // Check if Start Screen is visible (Game not active)
        else if (!gameActive && document.getElementById('start-screen').style.display === 'block') {
            gameActive = true;
            document.getElementById('start-screen').style.display = 'none';
        }
    }
});

