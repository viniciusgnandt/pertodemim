#!/bin/bash
# Start MongoDB with replica set for local development
# Run this if you're NOT using Docker

MONGO_DATA_DIR="$HOME/.pertodemim/mongodb"
mkdir -p "$MONGO_DATA_DIR"

echo "Starting MongoDB with replica set..."
mongod --replSet rs0 --dbpath "$MONGO_DATA_DIR" --port 27017 --bind_ip_all --fork --logpath "$MONGO_DATA_DIR/mongod.log"

sleep 2

echo "Initializing replica set..."
mongosh --eval "
try {
  rs.status();
  print('Replica set already initialized');
} catch(e) {
  rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] });
  print('Replica set initialized!');
}
"

echo "MongoDB ready!"
