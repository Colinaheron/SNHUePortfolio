// Simplified Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
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

    // Global variables
    let currentUser = null;
    let csvLoader = null;
    let isFullDataset = false;
    let currentPage = 1;
    const rowsPerPage = 10;

    // Setup event listeners
    function setupEventListeners() {
        console.log('Setting up event listeners');
        
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
        document.getElementById('rescue-type').addEventListener('change', filterTable);

        // Additional filters
        document.getElementById('animal-type-filter').addEventListener('change', filterTable);
        document.getElementById('outcome-type-filter').addEventListener('change', filterTable);
        document.getElementById('sex-filter').addEventListener('change', filterTable);

        // Reset filters
        document.getElementById('reset-filters').addEventListener('click', function() {
            document.getElementById('rescue-type').value = 'Reset';
            document.getElementById('animal-type-filter').value = '';
            document.getElementById('outcome-type-filter').value = '';
            document.getElementById('sex-filter').value = '';
            filterTable();
        });

        // Pagination controls
        document.getElementById('prev-page').addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updateTable(getFilteredData());
            }
        });

        document.getElementById('next-page').addEventListener('click', function() {
            const totalPages = Math.ceil(getFilteredData().length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updateTable(getFilteredData());
            }
        });

        // Dataset toggle
        document.getElementById('dataset-toggle').addEventListener('change', function(e) {
            isFullDataset = e.target.checked;
            loadData();
        });
    }

    // Initialize the dashboard
    async function initDashboard() {
        try {
            console.log('Initializing dashboard');
            
            // Setup event listeners
            setupEventListeners();
            
            // Load data
            await loadData();
            
            console.log('Dashboard initialization complete');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            alert('Failed to initialize dashboard: ' + error.message);
        }
    }

    // Load data using the CSV loader
    async function loadData() {
        try {
            console.log('Loading data');
            
            // Determine which CSV file to use
            const csvFile = isFullDataset ? 'aac_shelter_outcomes_full.csv' : 'aac_shelter_outcomes.csv';
            console.log(`Using CSV file: ${csvFile}`);
            
            // Create CSV loader
            csvLoader = new CSVLoader(csvFile);
            
            // Initialize the CSV loader
            await csvLoader.initialize();
            
            // Update the table with the loaded data
            updateTableFromCSV();
            
            console.log('Data loading complete');
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    // Update the table with data from the CSV loader
    function updateTableFromCSV() {
        if (!csvLoader) {
            console.error('CSV loader not initialized');
            return;
        }
        
        console.log('Updating table from CSV');
        
        // Get filtered data from the CSV loader
        const rescueType = document.getElementById('rescue-type').value;
        let filteredData = csvLoader.getFilteredAnimals(rescueType);
        
        // Apply additional filters
        const animalType = document.getElementById('animal-type-filter').value;
        const outcomeType = document.getElementById('outcome-type-filter').value;
        const sex = document.getElementById('sex-filter').value;
        
        const filters = {};
        if (animalType) filters.animal_type = animalType;
        if (outcomeType) filters.outcome_type = outcomeType;
        if (sex) filters.sex = sex;
        
        filteredData = csvLoader.applyFilters(filteredData, filters);
        
        // Update the table
        updateTable(filteredData);
        
        // Update statistics
        updateStatistics(filteredData);
    }

    // Get filtered data based on selected filters
    function getFilteredData() {
        if (!csvLoader) {
            console.error('CSV loader not initialized');
            return [];
        }
        
        // Get filtered data from the CSV loader
        const rescueType = document.getElementById('rescue-type').value;
        let filteredData = csvLoader.getFilteredAnimals(rescueType);
        
        // Apply additional filters
        const animalType = document.getElementById('animal-type-filter').value;
        const outcomeType = document.getElementById('outcome-type-filter').value;
        const sex = document.getElementById('sex-filter').value;
        
        const filters = {};
        if (animalType) filters.animal_type = animalType;
        if (outcomeType) filters.outcome_type = outcomeType;
        if (sex) filters.sex = sex;
        
        return csvLoader.applyFilters(filteredData, filters);
    }

    // Filter the table based on selected filters
    function filterTable() {
        console.log('Filtering table');
        updateTableFromCSV();
    }

    // Update the table with filtered data
    function updateTable(data) {
        console.log(`Updating table with ${data.length} records`);
        
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
        document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages || 1}`;
        document.getElementById('showing-info').textContent = `Showing ${startIndex + 1}-${endIndex} of ${data.length} animals`;
        
        // Enable/disable pagination buttons
        document.getElementById('prev-page').disabled = currentPage === 1;
        document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
    }

    // Update statistics
    function updateStatistics(animals) {
        console.log('Updating statistics');
        
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
        console.log(`Login attempt: ${username}`);
        
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
            console.log('Login successful');
        } else {
            document.getElementById('login-output').textContent = 'Invalid username or password';
            document.getElementById('login-output').style.color = 'red';
            console.log('Login failed');
        }
    }

    // Register function
    function register(username, password, role) {
        console.log(`Registration attempt: ${username}, role: ${role}`);
        
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
        console.log('Registration successful');
    }

    // Initialize the dashboard
    initDashboard();
});
