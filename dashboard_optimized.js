// Optimized Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Default admin user
    const defaultAdmin = {
        username: "admin",
        password: "admin123",
        role: "Admin"
    };

    // Initialize local storage with default admin if not exists
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([defaultAdmin]));
    }

    // Initialize loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">Loading data...</div>
    `;
    document.body.appendChild(loadingOverlay);

    // Global variables
    let currentUser = null;
    let tableData = [];
    let chart = null;
    let map = null;
    let markers = [];
    let currentPage = 1;
    const rowsPerPage = 10;

    // Setup event listeners
    function setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            login(username, password);
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value;
            register(username, password, role);
        });

        // Rescue type filter
        document.getElementById('rescue-type').addEventListener('change', function() {
            filterTable();
        });

        // Additional filters
        document.getElementById('animal-type-filter').addEventListener('change', function() {
            filterTable();
        });

        document.getElementById('outcome-type-filter').addEventListener('change', function() {
            filterTable();
        });

        document.getElementById('sex-filter').addEventListener('change', function() {
            filterTable();
        });

        document.getElementById('reset-filters').addEventListener('click', function() {
            document.getElementById('rescue-type').value = 'Reset';
            document.getElementById('animal-type-filter').value = '';
            document.getElementById('outcome-type-filter').value = '';
            document.getElementById('sex-filter').value = '';
            filterTable();
        });

        // CRUD buttons
        document.getElementById('create-btn').addEventListener('click', createAnimal);
        document.getElementById('update-btn').addEventListener('click', updateAnimal);
        document.getElementById('delete-btn').addEventListener('click', deleteAnimal);

        // Pagination controls
        if (document.getElementById('prev-page')) {
            document.getElementById('prev-page').addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    updateTable(getFilteredData());
                }
            });
        }

        if (document.getElementById('next-page')) {
            document.getElementById('next-page').addEventListener('click', function() {
                const totalPages = Math.ceil(getFilteredData().length / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    updateTable(getFilteredData());
                }
            });
        }
    }

    // Initialize the dashboard
    async function initDashboard() {
        try {
            // Load data from the sample data
            loadSampleData();
            
            // Setup event listeners
            setupEventListeners();
            
            // Initialize the table
            initTable();
            
            // Initialize chart
            initChart();
            
            // Initialize map
            setTimeout(initMap, 500); // Delay map initialization to ensure DOM is ready
            
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    // Load sample data
    function loadSampleData() {
        // Use the sample data from data.js
        if (typeof shelterData !== 'undefined') {
            tableData = shelterData.map(animal => ({
                name: animal.name,
                animal_type: animal.animalType,
                breed: animal.breed,
                age: animal.age,
                sex: animal.sexUponOutcome,
                outcome_type: animal.outcomeType,
                location_lat: animal.locationLat,
                location_long: animal.locationLong
            }));
        } else {
            // Fallback sample data if shelterData is not available
            tableData = [
                {
                    name: "Neptune",
                    animal_type: "Dog",
                    breed: "Labrador Retriever Mix",
                    age: "3 years",
                    sex: "Neutered Male",
                    outcome_type: "Available",
                    location_lat: 30.5066578739455,
                    location_long: -97.3408780722188
                },
                {
                    name: "Poseidon",
                    animal_type: "Dog",
                    breed: "Newfoundland",
                    age: "2 years",
                    sex: "Neutered Male",
                    outcome_type: "Available",
                    location_lat: 30.7595748121648,
                    location_long: -97.5523753807133
                }
            ];
        }
        
        // Add more simulated data
        const breeds = ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Beagle", "Bulldog", 
                       "Poodle", "Boxer", "Siberian Husky", "Dachshund", "Great Dane"];
        const animalTypes = ["Dog", "Cat", "Bird", "Rabbit", "Guinea Pig"];
        const outcomes = ["Adoption", "Transfer", "Return to Owner", "Euthanasia", "Died"];
        const sexes = ["Intact Male", "Neutered Male", "Intact Female", "Spayed Female"];
        const ages = ["1 month", "3 months", "6 months", "1 year", "2 years", "3 years", "4 years"];
        
        // Generate additional simulated data to represent the full CSV
        for (let i = 0; i < 100; i++) {
            tableData.push({
                name: `Pet${i}`,
                animal_type: animalTypes[Math.floor(Math.random() * animalTypes.length)],
                breed: breeds[Math.floor(Math.random() * breeds.length)],
                age: ages[Math.floor(Math.random() * ages.length)],
                sex: sexes[Math.floor(Math.random() * sexes.length)],
                outcome_type: outcomes[Math.floor(Math.random() * outcomes.length)],
                location_lat: 30 + Math.random(),
                location_long: -97 - Math.random()
            });
        }
        
        console.log(`Loaded ${tableData.length} records`);
    }

    // Initialize the table
    function initTable() {
        const tableBody = document.querySelector('#data-table tbody');
        tableBody.innerHTML = '';
        
        // Add click event to table rows for selection
        tableBody.addEventListener('click', function(e) {
            const tr = e.target.closest('tr');
            if (tr) {
                const isSelected = tr.classList.contains('selected');
                
                // Remove selected class from all rows
                document.querySelectorAll('#data-table tr.selected').forEach(row => {
                    row.classList.remove('selected');
                });
                
                if (!isSelected) {
                    tr.classList.add('selected');
                    
                    // Get the data for this row
                    const index = parseInt(tr.dataset.index);
                    const animal = getFilteredData()[index];
                    
                    // Update map
                    updateMapForAnimal(animal);
                }
            }
        });
        
        // Initial table update
        filterTable();
    }

    // Get filtered data based on selected filters
    function getFilteredData() {
        const rescueType = document.getElementById('rescue-type').value;
        const animalType = document.getElementById('animal-type-filter').value;
        const outcomeType = document.getElementById('outcome-type-filter').value;
        const sex = document.getElementById('sex-filter').value;
        
        // Apply filters
        let filteredData = [...tableData];
        
        // Apply rescue type filter
        if (rescueType !== 'Reset') {
            const breedFilter = rescueTypeFilters[rescueType] || [];
            filteredData = filteredData.filter(animal => breedFilter.includes(animal.breed));
        }
        
        // Apply animal type filter
        if (animalType) {
            filteredData = filteredData.filter(animal => animal.animal_type === animalType);
        }
        
        // Apply outcome type filter
        if (outcomeType) {
            filteredData = filteredData.filter(animal => animal.outcome_type === outcomeType);
        }
        
        // Apply sex filter
        if (sex) {
            filteredData = filteredData.filter(animal => animal.sex === sex);
        }
        
        return filteredData;
    }

    // Filter the table based on selected filters
    function filterTable() {
        const filteredData = getFilteredData();
        
        // Update the table
        updateTable(filteredData);
        
        // Update the chart
        updateChart(filteredData);
        
        // Update statistics
        updateStatistics(filteredData);

        // Update map
        if (map) {
            updateMapWithAnimals(filteredData.slice(0, 50));
        }
    }

    // Update the table with filtered data
    function updateTable(data) {
        const tableBody = document.querySelector('#data-table tbody');
        tableBody.innerHTML = '';
        
        const totalPages = Math.ceil(data.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, data.length);
        
        // Display current page data
        const displayData = data.slice(startIndex, endIndex);
        
        displayData.forEach((animal, index) => {
            const row = document.createElement('tr');
            row.dataset.index = startIndex + index;
            
            row.innerHTML = `
                <td>${animal.name || 'Unnamed'}</td>
                <td>${animal.animal_type || 'Unknown'}</td>
                <td>${animal.breed || 'Unknown'}</td>
                <td>${animal.age || 'Unknown'}</td>
                <td>${animal.sex || 'Unknown'}</td>
                <td>Lat: ${animal.location_lat.toFixed(4)}, Long: ${animal.location_long.toFixed(4)}</td>
            `;
            
            tableBody.appendChild(row);
        });

        // Update pagination info
        if (document.getElementById('page-info')) {
            document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;
        }
        
        if (document.getElementById('showing-info')) {
            document.getElementById('showing-info').textContent = `Showing ${startIndex + 1}-${endIndex} of ${data.length} animals`;
        }
        
        // Enable/disable pagination buttons
        if (document.getElementById('prev-page')) {
            document.getElementById('prev-page').disabled = currentPage === 1;
        }
        
        if (document.getElementById('next-page')) {
            document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
        }
    }

    // Initialize the chart
    function initChart() {
        try {
            const ctx = document.getElementById('chart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Loading...'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#CCCCCC']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        title: {
                            display: true,
                            text: 'Animal Breeds Distribution'
                        }
                    }
                }
            });
            
            // Update chart with initial data
            updateChart(tableData);
        } catch (error) {
            console.error('Error initializing chart:', error);
        }
    }

    // Update the chart with new data
    function updateChart(animals) {
        if (!chart) return;
        
        // Count breeds
        const breedCounts = {};
        animals.forEach(animal => {
            const breed = animal.breed || 'Unknown';
            breedCounts[breed] = (breedCounts[breed] || 0) + 1;
        });
        
        // Sort breeds by count (descending)
        const sortedBreeds = Object.entries(breedCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 breeds
        
        // Update chart data
        chart.data.labels = sortedBreeds.map(item => item[0]);
        chart.data.datasets[0].data = sortedBreeds.map(item => item[1]);
        chart.update();
    }

    // Initialize the map
    function initMap() {
        try {
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.error('Map element not found');
                return;
            }
            
            map = L.map('map').setView([30.75, -97.48], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Add a default marker to ensure the map has at least one pin
            const defaultMarker = L.marker([30.75, -97.48])
                .addTo(map)
                .bindPopup(`
                    <strong>Grazioso Salvare Headquarters</strong><br>
                    Main Training Facility<br>
                    Austin, TX
                `);
            
            markers.push(defaultMarker);
            
            // Open the popup for the default marker
            defaultMarker.openPopup();
            
            // Update map with initial data
            setTimeout(() => {
                updateMapWithAnimals(getFilteredData().slice(0, 50));
            }, 500);
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    // Update map with multiple animals
    function updateMapWithAnimals(animals) {
        if (!map) return;
        
        // Clear existing markers
        if (markers.length > 0) {
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
        }
        
        // Add markers for animals
        const validAnimals = animals.filter(animal => 
            animal && animal.location_lat && animal.location_long);
            
        if (validAnimals.length === 0) return;
        
        const bounds = L.latLngBounds();
        
        validAnimals.forEach(animal => {
            const marker = L.marker([animal.location_lat, animal.location_long])
                .addTo(map)
                .bindPopup(`
                    <strong>${animal.name || 'Unnamed'}</strong><br>
                    ${animal.breed}<br>
                    ${animal.age}, ${animal.sex}
                `);
            
            markers.push(marker);
            bounds.extend([animal.location_lat, animal.location_long]);
        });
        
        // Fit map to show all markers
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Update map for a specific animal
    function updateMapForAnimal(animal) {
        if (!map) return;
        
        // Clear existing markers
        if (markers.length > 0) {
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
        }
        
        // Add new marker
        if (animal && animal.location_lat && animal.location_long) {
            const marker = L.marker([animal.location_lat, animal.location_long])
                .addTo(map)
                .bindPopup(`
                    <strong>${animal.name || 'Unnamed'}</strong><br>
                    ${animal.breed}<br>
                    ${animal.age}, ${animal.sex}
                `);
            
            markers.push(marker);
            map.setView([animal.location_lat, animal.location_long], 12);
            marker.openPopup();
        }
    }

    // Update statistics
    function updateStatistics(animals) {
        document.getElementById('total-count').textContent = animals.length;
        
        // Count animal types
        const typeCounts = {};
        animals.forEach(animal => {
            const type = animal.animal_type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        // Get the most common animal type
        let mostCommonType = 'None';
        let maxCount = 0;
        for (const [type, count] of Object.entries(typeCounts)) {
            if (count > maxCount) {
                mostCommonType = type;
                maxCount = count;
            }
        }
        
        document.getElementById('most-common-type').textContent = mostCommonType;
        
        // Count outcome types
        const outcomeCounts = {};
        animals.forEach(animal => {
            const outcome = animal.outcome_type || 'Unknown';
            outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
        });
        
        // Calculate adoption rate
        const adoptionCount = outcomeCounts['Adoption'] || 0;
        const adoptionRate = animals.length > 0 ? (adoptionCount / animals.length * 100).toFixed(1) : '0.0';
        document.getElementById('adoption-rate').textContent = `${adoptionRate}%`;
    }

    // Login function
    function login(username, password) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username);
        
        if (user && user.password === password) {
            currentUser = user;
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('dashboard-content').style.display = 'block';
            
            // Show CRUD buttons for admin users
            if (user.role === 'Admin') {
                document.getElementById('crud-buttons').style.display = 'block';
            }
            
            document.getElementById('login-output').textContent = '';
        } else {
            document.getElementById('login-output').textContent = 'Invalid username or password';
            document.getElementById('login-output').style.color = 'red';
        }
    }

    // Register function
    function register(username, password, role) {
        if (!username || !password || !role) {
            document.getElementById('register-output').textContent = 'All fields are required';
            document.getElementById('register-output').style.color = 'red';
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if username already exists
        if (users.some(u => u.username === username)) {
            document.getElementById('register-output').textContent = 'Username already exists';
            document.getElementById('register-output').style.color = 'red';
            return;
        }
        
        // Add new user
        users.push({
            username,
            password,
            role
        });
        
        localStorage.setItem('users', JSON.stringify(users));
        
        document.getElementById('register-output').textContent = 'Registration successful';
        document.getElementById('register-output').style.color = 'green';
        
        // Clear form
        document.getElementById('register-form').reset();
    }

    // CRUD functions
    function createAnimal() {
        if (currentUser?.role !== 'Admin') {
            alert('Only admin users can create animals');
            return;
        }
        
        // In a real app, show a form to collect animal data
        alert('Create animal functionality would be implemented here');
    }

    function updateAnimal() {
        if (currentUser?.role !== 'Admin') {
            alert('Only admin users can update animals');
            return;
        }
        
        const selectedRows = document.querySelectorAll('#data-table tr.selected');
        if (selectedRows.length === 0) {
            alert('Please select an animal to update');
            return;
        }
        
        // In a real app, show a form with the selected animal's data
        alert('Update animal functionality would be implemented here');
    }

    function deleteAnimal() {
        if (currentUser?.role !== 'Admin') {
            alert('Only admin users can delete animals');
            return;
        }
        
        const selectedRows = document.querySelectorAll('#data-table tr.selected');
        if (selectedRows.length === 0) {
            alert('Please select an animal to delete');
            return;
        }
        
        // In a real app, confirm deletion and remove from database
        alert('Delete animal functionality would be implemented here');
    }

    // Show error message
    function showError(message) {
        loadingOverlay.innerHTML = `
            <div class="error-icon">❌</div>
            <div class="error-text">${message}</div>
            <button class="btn btn-primary mt-3" onclick="location.reload()">Retry</button>
        `;
    }

    // Rescue type filters
    const rescueTypeFilters = {
        Water: ["Labrador Retriever Mix", "Chesapeake Bay Retriever", "Newfoundland"],
        Mountain: ["German Shepherd", "Alaskan Malamute", "Old English Sheepdog", "Siberian Husky", "Rottweiler"],
        Disaster: ["Doberman Pinscher", "German Shepherd", "Golden Retriever", "Bloodhound", "Rottweiler"]
    };

    // Initialize the dashboard
    initDashboard();
});
