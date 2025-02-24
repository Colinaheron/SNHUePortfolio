// Extended shelter data with rescue-suitable breeds
const shelterData = [
    // Water Rescue Dogs
    {
        age: "3 years",
        animalId: "A746875",
        animalType: "Dog",
        breed: "Labrador Retriever Mix",
        color: "Black",
        dateOfBirth: "2020-02-15",
        datetime: "2023-02-15 10:00:00",
        name: "Neptune",
        outcomeType: "Available",
        sexUponOutcome: "Neutered Male",
        locationLat: 30.5066578739455,
        locationLong: -97.3408780722188,
        ageInWeeks: 156
    },
    {
        age: "2 years",
        animalId: "A746876",
        animalType: "Dog",
        breed: "Newfoundland",
        color: "Black",
        dateOfBirth: "2021-03-20",
        datetime: "2023-03-20 11:00:00",
        name: "Poseidon",
        outcomeType: "Available",
        sexUponOutcome: "Neutered Male",
        locationLat: 30.7595748121648,
        locationLong: -97.5523753807133,
        ageInWeeks: 104
    },
    {
        age: "4 years",
        animalId: "A746877",
        animalType: "Dog",
        breed: "Chesapeake Bay Retriever",
        color: "Brown",
        dateOfBirth: "2019-04-10",
        datetime: "2023-04-10 09:30:00",
        name: "Marina",
        outcomeType: "Available",
        sexUponOutcome: "Spayed Female",
        locationLat: 30.3188063374257,
        locationLong: -97.7240376703891,
        ageInWeeks: 208
    },
    // Mountain Rescue Dogs
    {
        age: "3 years",
        animalId: "A746878",
        animalType: "Dog",
        breed: "German Shepherd",
        color: "Black/Tan",
        dateOfBirth: "2020-05-15",
        datetime: "2023-05-15 14:00:00",
        name: "Summit",
        outcomeType: "Available",
        sexUponOutcome: "Neutered Male",
        locationLat: 30.6525984560228,
        locationLong: -97.7419963476444,
        ageInWeeks: 156
    },
    {
        age: "2 years",
        animalId: "A746879",
        animalType: "Dog",
        breed: "Alaskan Malamute",
        color: "Gray/White",
        dateOfBirth: "2021-06-20",
        datetime: "2023-06-20 15:30:00",
        name: "Alpine",
        outcomeType: "Available",
        sexUponOutcome: "Spayed Female",
        locationLat: 30.4525984560228,
        locationLong: -97.6419963476444,
        ageInWeeks: 104
    },
    {
        age: "4 years",
        animalId: "A746880",
        animalType: "Dog",
        breed: "Siberian Husky",
        color: "Gray/White",
        dateOfBirth: "2019-07-10",
        datetime: "2023-07-10 16:00:00",
        name: "Everest",
        outcomeType: "Available",
        sexUponOutcome: "Neutered Male",
        locationLat: 30.5525984560228,
        locationLong: -97.5419963476444,
        ageInWeeks: 208
    },
    // Disaster Rescue Dogs
    {
        age: "3 years",
        animalId: "A746881",
        animalType: "Dog",
        breed: "Golden Retriever",
        color: "Golden",
        dateOfBirth: "2020-08-15",
        datetime: "2023-08-15 10:30:00",
        name: "Hero",
        outcomeType: "Available",
        sexUponOutcome: "Neutered Male",
        locationLat: 30.3525984560228,
        locationLong: -97.4419963476444,
        ageInWeeks: 156
    },
    {
        age: "2 years",
        animalId: "A746882",
        animalType: "Dog",
        breed: "Bloodhound",
        color: "Red",
        dateOfBirth: "2021-09-20",
        datetime: "2023-09-20 11:30:00",
        name: "Scout",
        outcomeType: "Available",
        sexUponOutcome: "Neutered Male",
        locationLat: 30.2525984560228,
        locationLong: -97.3419963476444,
        ageInWeeks: 104
    },
    {
        age: "4 years",
        animalId: "A746883",
        animalType: "Dog",
        breed: "Rottweiler",
        color: "Black/Tan",
        dateOfBirth: "2019-10-10",
        datetime: "2023-10-10 12:00:00",
        name: "Guardian",
        outcomeType: "Available",
        sexUponOutcome: "Spayed Female",
        locationLat: 30.1525984560228,
        locationLong: -97.2419963476444,
        ageInWeeks: 208
    }
];

// Breed filters for different rescue types
const rescueTypeFilters = {
    Water: ["Labrador Retriever Mix", "Chesapeake Bay Retriever", "Newfoundland"],
    Mountain: ["German Shepherd", "Alaskan Malamute", "Old English Sheepdog", "Siberian Husky", "Rottweiler"],
    Disaster: ["Doberman Pinscher", "German Shepherd", "Golden Retriever", "Bloodhound", "Rottweiler"]
};

// User data stored in localStorage
const defaultAdmin = {
    username: "admin",
    password: "$2a$10$xWZXy3vQvYuL4KMCRn.OJeQBpIwg2yYL1Mx5DUZS.F4JcZDpqrOSS", // hashed "admin123"
    role: "Admin"
};

// Initialize local storage with default admin if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([defaultAdmin]));
}

// Store initial data in localStorage if not exists
if (!localStorage.getItem('shelterData')) {
    localStorage.setItem('shelterData', JSON.stringify(shelterData));
}

// Helper functions for data management
const DataService = {
    getAllAnimals() {
        return JSON.parse(localStorage.getItem('shelterData')) || [];
    },

    getFilteredAnimals(rescueType) {
        const animals = this.getAllAnimals();
        if (!rescueType || rescueType === 'Reset') return animals;
        
        const breedFilter = rescueTypeFilters[rescueType];
        return animals.filter(animal => breedFilter.includes(animal.breed));
    },

    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    },

    addUser(username, hashedPassword, role) {
        const users = this.getUsers();
        users.push({ username, password: hashedPassword, role });
        localStorage.setItem('users', JSON.stringify(users));
    },

    findUser(username) {
        return this.getUsers().find(user => user.username === username);
    },

    addAnimal(animalData) {
        const animals = this.getAllAnimals();
        animals.push(animalData);
        localStorage.setItem('shelterData', JSON.stringify(animals));
    },

    updateAnimal(animalId, updatedData) {
        const animals = this.getAllAnimals();
        const index = animals.findIndex(a => a.animalId === animalId);
        if (index !== -1) {
            animals[index] = { ...animals[index], ...updatedData };
            localStorage.setItem('shelterData', JSON.stringify(animals));
            return true;
        }
        return false;
    },

    deleteAnimal(animalId) {
        const animals = this.getAllAnimals();
        const filteredAnimals = animals.filter(a => a.animalId !== animalId);
        localStorage.setItem('shelterData', JSON.stringify(filteredAnimals));
    }
};
