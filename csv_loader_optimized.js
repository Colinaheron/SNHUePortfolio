// Optimized CSV Loader with streaming capabilities for large files
class CSVLoader {
    constructor(filePath) {
        this.filePath = filePath;
        this.cache = {};
        this.indexedData = {
            byBreed: {},
            byType: {},
            byOutcomeType: {},
            byAge: {},
            bySex: {}
        };
        this.filters = {};
        this.isLoading = false;
        this.loadedCount = 0;
        this.totalCount = 0;
        this.chunkSize = 1000; // Number of lines to process in each chunk
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        
        // Rescue type filters
        this.rescueTypeFilters = {
            Water: ["Labrador Retriever Mix", "Chesapeake Bay Retriever", "Newfoundland"],
            Mountain: ["German Shepherd", "Alaskan Malamute", "Old English Sheepdog", "Siberian Husky", "Rottweiler"],
            Disaster: ["Doberman Pinscher", "German Shepherd", "Golden Retriever", "Bloodhound", "Rottweiler"]
        };
    }

    // Set progress callback
    onProgress(callback) {
        this.onProgressCallback = callback;
        return this;
    }

    // Set complete callback
    onComplete(callback) {
        this.onCompleteCallback = callback;
        return this;
    }

    // Initialize the data indexing with streaming approach
    async initialize() {
        console.log(`Initializing CSV loader for ${this.filePath}`);
        
        if (this.isLoading) {
            console.warn('CSV loader is already loading data');
            return false;
        }
        
        this.isLoading = true;
        this.loadedCount = 0;
        
        try {
            // Check if we should use the full CSV or sample data
            const useFullCSV = this.filePath.includes('full');
            
            if (useFullCSV) {
                // Use streaming approach for the full CSV
                await this.loadCSVInChunks();
            } else {
                // For smaller files, use the sample data approach
                await this.loadSampleData();
            }
            
            console.log(`Finished processing data. Loaded ${this.loadedCount} records.`);
            
            if (this.onCompleteCallback) {
                this.onCompleteCallback(this.loadedCount);
            }
            
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('Error initializing CSV loader:', error);
            this.isLoading = false;
            return false;
        }
    }
    
    // Load CSV file in chunks using FileReader
    async loadCSVInChunks() {
        return new Promise((resolve, reject) => {
            try {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.csv';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                fileInput.onchange = (event) => {
                    const file = event.target.files[0];
                    if (!file) {
                        document.body.removeChild(fileInput);
                        reject(new Error('No file selected'));
                        return;
                    }
                    
                    this.totalCount = 0; // Will be updated as we read
                    let headerProcessed = false;
                    let columnMap = {};
                    let buffer = '';
                    let startPos = 0;
                    let chunkSize = 1024 * 1024; // 1MB chunks
                    
                    const processChunk = (chunk) => {
                        buffer += chunk;
                        let lineEnd = buffer.indexOf('\n');
                        let linesProcessed = 0;
                        
                        while (lineEnd !== -1) {
                            const line = buffer.substring(0, lineEnd).trim();
                            buffer = buffer.substring(lineEnd + 1);
                            
                            if (line.length > 0) {
                                if (!headerProcessed) {
                                    // Process header
                                    const headers = this.parseCSVLine(line);
                                    headers.forEach((header, index) => {
                                        columnMap[header.replace(/"/g, '')] = index;
                                    });
                                    headerProcessed = true;
                                } else {
                                    // Process data line
                                    const values = this.parseCSVLine(line);
                                    
                                    // Create a row object from the CSV values
                                    const row = {
                                        name: values[columnMap['name']]?.replace(/"/g, '') || '',
                                        animal_type: values[columnMap['animal_type']]?.replace(/"/g, '') || '',
                                        breed: values[columnMap['breed']]?.replace(/"/g, '') || '',
                                        age: values[columnMap['age_upon_outcome']]?.replace(/"/g, '') || '',
                                        sex: values[columnMap['sex_upon_outcome']]?.replace(/"/g, '') || '',
                                        outcome_type: values[columnMap['outcome_type']]?.replace(/"/g, '') || '',
                                        location_lat: parseFloat(values[columnMap['location_lat']]?.replace(/"/g, '') || 0),
                                        location_long: parseFloat(values[columnMap['location_long']]?.replace(/"/g, '') || 0)
                                    };
                                    
                                    // Index the row for faster filtering
                                    this.indexRow(row);
                                    this.loadedCount++;
                                    this.totalCount++;
                                }
                            }
                            
                            linesProcessed++;
                            lineEnd = buffer.indexOf('\n');
                            
                            // Report progress periodically
                            if (linesProcessed % this.chunkSize === 0 && this.onProgressCallback) {
                                this.onProgressCallback(this.loadedCount, this.totalCount);
                            }
                        }
                    };
                    
                    const readNextChunk = () => {
                        if (startPos >= file.size) {
                            // We've read the entire file
                            // Process any remaining data in the buffer
                            if (buffer.length > 0) {
                                processChunk('');
                            }
                            
                            document.body.removeChild(fileInput);
                            resolve();
                            return;
                        }
                        
                        const endPos = Math.min(startPos + chunkSize, file.size);
                        const blob = file.slice(startPos, endPos);
                        const reader = new FileReader();
                        
                        reader.onload = (e) => {
                            processChunk(e.target.result);
                            startPos = endPos;
                            readNextChunk();
                        };
                        
                        reader.onerror = (e) => {
                            document.body.removeChild(fileInput);
                            reject(new Error(`Error reading file: ${e.target.error}`));
                        };
                        
                        reader.readAsText(blob);
                    };
                    
                    // Start reading the file
                    readNextChunk();
                };
                
                // Trigger file selection dialog
                fileInput.click();
                
                // If user cancels the dialog, resolve with sample data
                setTimeout(() => {
                    if (!this.loadedCount) {
                        console.log('File selection canceled or timed out, loading sample data instead');
                        document.body.removeChild(fileInput);
                        this.loadSampleData().then(resolve).catch(reject);
                    }
                }, 30000); // 30 second timeout
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Load sample data for testing or when file selection is canceled
    async loadSampleData() {
        console.log('Loading sample data');
        
        try {
            // Use the sample data from data.js
            console.log('Accessing shelterData from data.js');
            if (typeof shelterData === 'undefined') {
                console.error('shelterData is undefined. Make sure data.js is loaded before csv_loader_optimized.js');
                throw new Error('shelterData is undefined');
            }
            const sampleData = shelterData;
            console.log(`Found ${sampleData.length} records in shelterData`);
            
            // Process the sample data
            for (const animal of sampleData) {
                // Convert the data structure to match CSV format
                const row = {
                    name: animal.name,
                    animal_type: animal.animalType,
                    breed: animal.breed,
                    age: animal.age,
                    sex: animal.sexUponOutcome,
                    outcome_type: animal.outcomeType,
                    location_lat: animal.locationLat,
                    location_long: animal.locationLong
                };
                
                // Index the row for faster filtering
                this.indexRow(row);
                this.loadedCount++;
            }
            
            // Simulate loading more data by duplicating and slightly modifying the sample data
            const breeds = ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Beagle", "Bulldog", 
                           "Poodle", "Boxer", "Siberian Husky", "Dachshund", "Great Dane", "Doberman Pinscher",
                           "Australian Shepherd", "Miniature Schnauzer", "Shih Tzu", "Boston Terrier",
                           "Pomeranian", "French Bulldog", "Border Collie", "Shetland Sheepdog", "Cavalier King Charles Spaniel"];
            
            const animalTypes = ["Dog", "Cat", "Bird", "Rabbit", "Guinea Pig"];
            const outcomes = ["Adoption", "Transfer", "Return to Owner", "Euthanasia", "Died"];
            const sexes = ["Intact Male", "Neutered Male", "Intact Female", "Spayed Female"];
            const ages = ["1 month", "3 months", "6 months", "1 year", "2 years", "3 years", "4 years", "5 years", "6 years", "7 years", "8 years"];
            
            // Generate additional simulated data
            for (let i = 0; i < 100; i++) {
                const row = {
                    name: `Pet${i}`,
                    animal_type: animalTypes[Math.floor(Math.random() * animalTypes.length)],
                    breed: breeds[Math.floor(Math.random() * breeds.length)],
                    age: ages[Math.floor(Math.random() * ages.length)],
                    sex: sexes[Math.floor(Math.random() * sexes.length)],
                    outcome_type: outcomes[Math.floor(Math.random() * outcomes.length)],
                    location_lat: 30 + Math.random(),
                    location_long: -97 - Math.random()
                };
                
                // Index the row
                this.indexRow(row);
                this.loadedCount++;
            }
            
            console.log(`Loaded ${this.loadedCount} sample records`);
            
            if (this.onProgressCallback) {
                this.onProgressCallback(this.loadedCount, this.loadedCount);
            }
            
            return true;
        } catch (error) {
            console.error('Error loading sample data:', error);
            throw error;
        }
    }
    
    // Parse a CSV line, handling quoted values
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
    
    // Index a row for faster filtering
    indexRow(row) {
        // Index by breed
        const breed = row.breed || '';
        if (!this.indexedData.byBreed[breed]) {
            this.indexedData.byBreed[breed] = [];
        }
        this.indexedData.byBreed[breed].push(row);
        
        // Index by animal type
        const animalType = row.animal_type || '';
        if (!this.indexedData.byType[animalType]) {
            this.indexedData.byType[animalType] = [];
        }
        this.indexedData.byType[animalType].push(row);
        
        // Index by outcome type
        const outcomeType = row.outcome_type || '';
        if (!this.indexedData.byOutcomeType[outcomeType]) {
            this.indexedData.byOutcomeType[outcomeType] = [];
        }
        this.indexedData.byOutcomeType[outcomeType].push(row);
        
        // Index by age
        const age = row.age || '';
        if (!this.indexedData.byAge[age]) {
            this.indexedData.byAge[age] = [];
        }
        this.indexedData.byAge[age].push(row);
        
        // Index by sex
        const sex = row.sex || '';
        if (!this.indexedData.bySex[sex]) {
            this.indexedData.bySex[sex] = [];
        }
        this.indexedData.bySex[sex].push(row);
    }
    
    // Get animals filtered by rescue type
    getFilteredAnimals(rescueType) {
        // Use the cache if we've already computed this filter
        const cacheKey = `filter_${rescueType}`;
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }
        
        // Apply the filter
        let result = [];
        if (!rescueType || rescueType === 'Reset') {
            // For reset, return a sample of the data to avoid overwhelming the browser
            const sampleSize = Math.min(500, this.loadedCount);
            const breeds = Object.keys(this.indexedData.byBreed);
            for (const breed of breeds) {
                const animals = this.indexedData.byBreed[breed];
                if (animals.length > 0) {
                    result = result.concat(animals.slice(0, Math.ceil(sampleSize / breeds.length)));
                }
                if (result.length >= sampleSize) break;
            }
        } else {
            // Apply the rescue type filter
            const breedFilter = this.rescueTypeFilters[rescueType] || [];
            for (const breed of breedFilter) {
                if (this.indexedData.byBreed[breed]) {
                    result = result.concat(this.indexedData.byBreed[breed]);
                }
            }
        }
        
        // Cache the result
        this.cache[cacheKey] = result;
        return result;
    }
    
    // Apply additional filters to the data
    applyFilters(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data;
        }
        
        return data.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (item[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
    
    // Set a filter
    setFilter(key, value) {
        this.filters[key] = value;
        // Clear the cache when filters change
        this.cache = {};
    }
    
    // Clear a filter
    clearFilter(key) {
        delete this.filters[key];
        // Clear the cache when filters change
        this.cache = {};
    }
    
    // Clear all filters
    clearAllFilters() {
        this.filters = {};
        this.cache = {};
    }
    
    // Get statistics about the data
    getStatistics() {
        return {
            totalRecords: this.loadedCount,
            totalBreeds: Object.keys(this.indexedData.byBreed).length,
            totalAnimalTypes: Object.keys(this.indexedData.byType).length,
            totalOutcomeTypes: Object.keys(this.indexedData.byOutcomeType).length,
            breedCounts: Object.fromEntries(
                Object.entries(this.indexedData.byBreed).map(([breed, animals]) => [breed, animals.length])
            ),
            typeCounts: Object.fromEntries(
                Object.entries(this.indexedData.byType).map(([type, animals]) => [type, animals.length])
            ),
            outcomeCounts: Object.fromEntries(
                Object.entries(this.indexedData.byOutcomeType).map(([outcome, animals]) => [outcome, animals.length])
            )
        };
    }
}

// Rescue type filters
const rescueTypeFilters = {
    Water: ["Labrador Retriever Mix", "Chesapeake Bay Retriever", "Newfoundland"],
    Mountain: ["German Shepherd", "Alaskan Malamute", "Old English Sheepdog", "Siberian Husky", "Rottweiler"],
    Disaster: ["Doberman Pinscher", "German Shepherd", "Golden Retriever", "Bloodhound", "Rottweiler"]
};
