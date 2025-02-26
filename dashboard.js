// Enhanced Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">Loading data...</div>
    `;
    document.body.appendChild(loadingOverlay);

    // Global variables
    let csvLoader = null;
    let currentUser = null;
    let chart = null;
    let map = null;
    let markers = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredData = [];

    // Initialize the dashboard
    async function initDashboard() {
        try {
            // Initialize the CSV loader with the full CSV file
            csvLoader = new CSVLoader('aac_shelter_outcomes_full.csv');
            const initialized = await csvLoader.initialize();
            
            if (!initialized) {
                showError('Failed to initialize CSV loader');
                return;
            }
            
            // Setup event listeners
            setupEventListeners();
            
            // Initialize DataTable
            initTable();
            
            // Initialize chart
            initChart();
            
            // Initialize map
            initMap();
            
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showError('Failed to initialize dashboard: ' + error.message);
        }
    }

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
            updateTable();
        });

        // Additional filters
        document.getElementById('animal-type-filter').addEventListener('change', function() {
            csvLoader.setFilter('animal_type', this.value);
            updateTable();
        });

        document.getElementById('outcome-type-filter').addEventListener('change', function() {
            csvLoader.setFilter('outcome_type', this.value);
            updateTable();
        });

        document.getElementById('sex-filter').addEventListener('change', function() {
            csvLoader.setFilter('sex_upon_outcome', this.value);
            updateTable();
        });

        document.getElementById('reset-filters').addEventListener('click', function() {
            document.getElementById('rescue-type').value = 'Reset';
            document.getElementById('animal-type-filter').value = '';
            document.getElementById('outcome-type-filter').value = '';
            document.getElementById('sex-filter').value = '';
            csvLoader.clearAllFilters();
            updateTable();
        });

        // CRUD buttons
        document.getElementById('create-btn').addEventListener('click', createAnimal);
        document.getElementById('update-btn').addEventListener('click', updateAnimal);
        document.getElementById('delete-btn').addEventListener('click', deleteAnimal);
    }

    // Initialize the table
    function initTable() {
        const tableBody = document.querySelector('#data-table tbody');
        
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
                    const animal = filteredData[index];
                    
                    // Update map
                    updateMapForAnimal(animal);
                }
            }
        });
        
        // Initial table update
        updateTable();
    }

    // Update the table
    function updateTable() {
        const rescueType = document.getElementById('rescue-type').value;
        const animals = csvLoader.getFilteredAnimals(rescueType);
        
        // Apply any additional filters
        filteredData = csvLoader.applyFilters(animals, csvLoader.filters);
        
        // Update the table with paginated data
        updateTableWithPagination(filteredData);
        
        // Update the chart
        updateChart(filteredData);
        
        // Update statistics
        updateStatistics(filteredData);
        
        // Update map with first 50 animals
        updateMapWithAnimals(filteredData.slice(0, 50));
    }
    
    // Update table with pagination
    function updateTableWithPagination(data) {
        const tableBody = document.querySelector('#data-table tbody');
        tableBody.innerHTML = '';
        
        const totalPages = Math.ceil(data.length / rowsPerPage);
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, data.length);
        
        // Display current page data
        for (let i = startIndex; i < endIndex; i++) {
            const animal = data[i];
            const row = document.createElement('tr');
            row.dataset.index = i;
            
            row.innerHTML = `
                <td>${animal.name || 'Unnamed'}</td>
                <td>${animal.animal_type || 'Unknown'}</td>
                <td>${animal.breed || 'Unknown'}</td>
                <td>${animal.age_upon_outcome || 'Unknown'}</td>
                <td>${animal.sex_upon_outcome || 'Unknown'}</td>
                <td>Lat: ${animal.location_lat.toFixed(4)}, Long: ${animal.location_long.toFixed(4)}</td>
            `;
            
            tableBody.appendChild(row);
        }
        
        // Add pagination controls if they don't exist
        if (!document.getElementById('pagination-controls')) {
            const tableContainer = document.querySelector('.table-responsive');
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'pagination-controls';
            paginationDiv.className = 'mt-3 d-flex justify-content-between align-items-center';
            
            paginationDiv.innerHTML = `
                <div>
                    <button id="prev-page" class="btn btn-sm btn-outline-primary">Previous</button>
                    <span id="page-info" class="mx-2">Page ${currentPage} of ${totalPages || 1}</span>
                    <button id="next-page" class="btn btn-sm btn-outline-primary">Next</button>
                </div>
                <div>
                    <span id="showing-info">Showing ${startIndex + 1}-${endIndex} of ${data.length} animals</span>
                </div>
            `;
            
            tableContainer.appendChild(paginationDiv);
            
            // Add pagination event listeners
            document.getElementById('prev-page').addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    updateTableWithPagination(filteredData);
                }
            });
            
            document.getElementById('next-page').addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    updateTableWithPagination(filteredData);
                }
            });
        } else {
            // Update pagination info
            document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;
            document.getElementById('showing-info').textContent = `Showing ${startIndex + 1}-${endIndex} of ${data.length} animals`;
            
            // Enable/disable pagination buttons
            document.getElementById('prev-page').disabled = currentPage === 1;
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
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                            '#FF9F40', '#8AC249', '#EA5545', '#F46A9B', '#EF9B20'
                        ]
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
        map = L.map('map').setView([30.75, -97.48], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
    
    // Update map with multiple animals
    function updateMapWithAnimals(animals) {
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
                    ${animal.age_upon_outcome}, ${animal.sex_upon_outcome}
                `);
            
            markers.push(marker);
            bounds.extend([animal.location_lat, animal.location_long]);
        });
        
        // Fit map to show all markers
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Update map for a specific animal
    function updateMapForAnimal(animal) {
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
                    ${animal.age_upon_outcome}, ${animal.sex_upon_outcome}
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
        
        if (user && user.password === password) { // In a real app, use proper password hashing
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
            password, // In a real app, use proper password hashing
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

    // Initialize the dashboard
    initDashboard();
});
