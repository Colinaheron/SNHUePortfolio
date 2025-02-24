#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jan 29 17:27:56 2024

@auth: colinaheron_snhu
"""

from pymongo import MongoClient, ASCENDING
from bson.objectid import ObjectId

class AnimalShelter(object):
    """ CRUD operations for Animal collection in MongoDB """

    def __init__(self, user='aacuser', password='yourpassword', host='nv-desktop-services.apporto.com', port=31828, db='AAC', col='animals'):
        # Initialize MongoDB connection
        self.client = MongoClient(f'mongodb://{user}:{password}@{host}:{port}')
        self.database = self.client[db]
        self.collection = self.database[col]

    def create(self, data):
        """Create a new record in the collection."""
        if data:
            self.collection.insert_one(data)
            return True
        else:
            raise Exception("Nothing to save, because data parameter is empty")

    def read(self, query):
        """Read records from the collection based on the query."""
        if query:
            result = self.collection.find(query)
            return list(result)
        else:
            raise Exception("Query parameter is empty. Provide a valid query.")

    def update(self, query, new_data):
        """Update records in the collection based on the query."""
        if query and new_data:
            result = self.collection.update_many(query, {"$set": new_data})
            return result.modified_count
        else:
            raise Exception("Both query and new_data parameters are required.")

    def delete(self, query):
        """Delete records from the collection based on the query."""
        if query:
            result = self.collection.delete_many(query)
            return result.deleted_count
        else:
            raise Exception("Query parameter is empty. Provide a valid query.")

    def get_animals_by_location(self, location_lat, location_long):
        """Fetch animals based on their location (latitude and longitude)."""
        if location_lat is not None and location_long is not None:
            query = {"location_lat": location_lat, "location_long": location_long}
            result = self.collection.find(query)
            return list(result)
        else:
            raise Exception("Latitude and Longitude must be provided.")

def create_indexes():
    """Create indexes for frequently queried fields."""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['your_database']
    collection = db['your_collection']
    collection.create_index([("breed", ASCENDING), ("age", ASCENDING), ("location", ASCENDING)])
    client.close()

def get_animals_by_breed(breed):
    """Example of optimized query using index hint."""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['your_database']
    collection = db['your_collection']
    result = collection.find({'breed': breed}).hint([("breed", ASCENDING)])
    client.close()
    return list(result)

# Plan for caching (pseudo-code)
cache = {}

def get_cached_animals_by_breed(breed):
    if breed in cache:
        return cache[breed]
    else:
        result = get_animals_by_breed(breed)
        cache[breed] = result
        return result

def invalidate_cache():
    global cache
    cache = {}

def add_animal(animal_data):
    """Example CRUD operation with cache invalidation."""
    client = MongoClient('mongodb://localhost:27017/')
    db = client['your_database']
    collection = db['your_collection']
    collection.insert_one(animal_data)
    client.close()
    invalidate_cache()

class MongoDBHelper:
    def __init__(self, db_name, collection_name):
        """Initializes MongoDB connection"""
        self.client = MongoClient("mongodb://localhost:27017")
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

    def import_csv_to_mongo(self, csv_file):
        """Imports CSV data into MongoDB"""
        df = pd.read_csv(csv_file)  # Read the CSV file into a DataFrame
        records = df.to_dict(orient="records")  # Convert DataFrame to a list of dictionaries
        self.collection.insert_many(records)  # Insert records into MongoDB
        print(f"Data from {csv_file} imported successfully!")

    def fetch_all_records(self):
        """Fetches all records from MongoDB collection"""
        records = list(self.collection.find({}))
        for record in records:
            record["_id"] = str(record["_id"])  # Convert MongoDB _id to string for easier JSON handling
        return records

    def clear_collection(self):
        """Clear the MongoDB collection (for testing purposes)"""
        self.collection.delete_many({})

