// BCrypt implementation for password hashing (simplified version for demo)
const bcrypt = {
    hashSync: (password) => {
        // In a real implementation, this would use actual BCrypt
        return `$2a$10$${btoa(password)}`;
    },
    compareSync: (password, hash) => {
        // In a real implementation, this would use actual BCrypt comparison
        return `$2a$10$${btoa(password)}` === hash;
    }
};

let currentUser = null;
let map = null;
let chart = null;
let selectedRow = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    setupEventListeners();
    initializeChart();
});

// Initialize Leaflet map
function initializeMap() {
    // Ensure map container is visible and sized before initialization
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.height = '400px';
        mapContainer.style.width = '100%';
        map = L.map('map').setView([30.2672, -97.7431], 11);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
            minZoom: 5
        }).addTo(map);

        // Add a default marker for Austin Animal Center's actual location
        L.marker([30.2672, -97.7431])
            .bindPopup('Austin Animal Center')
            .addTo(map)
            .openPopup();
        
        // Ensure the map is centered on the marker
        setTimeout(() => {
            map.setView([30.2672, -97.7431], 11);
        }, 200);
        
        // Force a resize event after initialization
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

// Initialize Chart.js pie chart
function initializeChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Animal Breeds Distribution'
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Authentication
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Dashboard controls
    document.getElementById('rescue-type').addEventListener('change', handleRescueTypeChange);
    document.getElementById('create-btn').addEventListener('click', handleCreate);
    document.getElementById('update-btn').addEventListener('click', handleUpdate);
    document.getElementById('delete-btn').addEventListener('click', handleDelete);
}

// Authentication handlers
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const user = DataService.findUser(username);

    if (user && bcrypt.compareSync(password, user.password)) {
        currentUser = user;
        document.getElementById('login-output').innerHTML = 
            `<div class="alert alert-success">Welcome ${username}! Role: ${user.role}</div>`;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'block';
        
        if (user.role === 'Admin') {
            document.getElementById('crud-buttons').style.display = 'block';
        }
        
        updateDashboard();
    } else {
        document.getElementById('login-output').innerHTML = 
            '<div class="alert alert-danger">Invalid credentials</div>';
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    if (!username || !password || !role) {
        document.getElementById('register-output').innerHTML = 
            '<div class="alert alert-danger">All fields are required</div>';
        return;
    }

    if (DataService.findUser(username)) {
        document.getElementById('register-output').innerHTML = 
            '<div class="alert alert-danger">Username already exists</div>';
        return;
    }

    const hashedPassword = bcrypt.hashSync(password);
    DataService.addUser(username, hashedPassword, role);
    
    document.getElementById('register-output').innerHTML = 
        '<div class="alert alert-success">Registration successful</div>';
}

// Dashboard update functions
function updateDashboard(rescueType = 'Reset') {
    const animals = DataService.getFilteredAnimals(rescueType);
    updateTable(animals);
    updateChart(animals);
    
    // Select first row by default if no row is selected
    if (animals.length > 0) {
        if (selectedRow === null) {
            selectedRow = 0;
            const tbody = document.querySelector('#data-table tbody');
            if (tbody.rows[0]) {
                tbody.rows[0].classList.add('selected-row');
            }
        }
        updateMap(animals[selectedRow]);
    }
}

function updateTable(animals) {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = '';

    animals.forEach((animal, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${animal.name || 'N/A'}</td>
            <td>${animal.animalType}</td>
            <td>${animal.breed}</td>
            <td>${animal.age}</td>
            <td>${animal.sexUponOutcome}</td>
            <td>${animal.locationLat.toFixed(4)}, ${animal.locationLong.toFixed(4)}</td>
        `;

        row.addEventListener('click', () => {
            if (selectedRow !== null) {
                tbody.rows[selectedRow].classList.remove('selected-row');
            }
            selectedRow = index;
            row.classList.add('selected-row');
            updateMap(animal);
        });
    });
}

function updateChart(animals) {
    const breedCounts = animals.reduce((acc, animal) => {
        acc[animal.breed] = (acc[animal.breed] || 0) + 1;
        return acc;
    }, {});

    chart.data.labels = Object.keys(breedCounts);
    chart.data.datasets[0].data = Object.values(breedCounts);
    chart.update();
}

function updateMap(animal) {
    map.setView([animal.locationLat, animal.locationLong], 13);
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    L.marker([animal.locationLat, animal.locationLong])
        .bindPopup(`
            <b>${animal.name || 'N/A'}</b><br>
            ${animal.breed}<br>
            ${animal.age}<br>
            ${animal.sexUponOutcome}
        `)
        .addTo(map)
        .openPopup();
}

// Event handlers
function handleRescueTypeChange(e) {
    const rescueType = e.target.value;
    updateDashboard(rescueType);
}

function handleCreate() {
    if (!currentUser || currentUser.role !== 'Admin') {
        alert('Permission denied');
        return;
    }

    const newAnimal = {
        animalId: `A${Date.now().toString().slice(-6)}`,
        name: prompt('Enter animal name:') || '',
        animalType: prompt('Enter animal type:'),
        breed: prompt('Enter breed:'),
        age: prompt('Enter age:'),
        sexUponOutcome: prompt('Enter sex:'),
        locationLat: parseFloat(prompt('Enter latitude:')),
        locationLong: parseFloat(prompt('Enter longitude:')),
        outcomeType: 'Available',
        dateOfBirth: new Date().toISOString().split('T')[0],
        datetime: new Date().toISOString()
    };

    if (!newAnimal.animalType || !newAnimal.breed) {
        alert('Animal type and breed are required');
        return;
    }

    DataService.addAnimal(newAnimal);
    updateDashboard(document.getElementById('rescue-type').value);
}

function handleUpdate() {
    if (!currentUser || currentUser.role !== 'Admin' || selectedRow === null) {
        alert('Select a row and ensure you have admin privileges');
        return;
    }

    const animals = DataService.getFilteredAnimals(document.getElementById('rescue-type').value);
    const animal = animals[selectedRow];
    
    const updatedData = {
        name: prompt('Enter new name:', animal.name) || animal.name,
        breed: prompt('Enter new breed:', animal.breed) || animal.breed,
        age: prompt('Enter new age:', animal.age) || animal.age,
        sexUponOutcome: prompt('Enter new sex:', animal.sexUponOutcome) || animal.sexUponOutcome
    };

    DataService.updateAnimal(animal.animalId, updatedData);
    updateDashboard(document.getElementById('rescue-type').value);
}

function handleDelete() {
    if (!currentUser || currentUser.role !== 'Admin' || selectedRow === null) {
        alert('Select a row and ensure you have admin privileges');
        return;
    }

    if (confirm('Are you sure you want to delete this animal?')) {
        const animals = DataService.getFilteredAnimals(document.getElementById('rescue-type').value);
        DataService.deleteAnimal(animals[selectedRow].animalId);
        selectedRow = null;
        updateDashboard(document.getElementById('rescue-type').value);
    }
}
