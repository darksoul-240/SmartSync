// --- NODE.JS & EXPRESS SERVER (Unit I & V) ---
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows server to understand JSON data in HTTP POST requests
app.use(express.static('public')); // Serves your index.html, app.js, and CSS from the 'public' folder

// MongoDB Connection String (Replace with your own if using MongoDB Atlas)
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://ibrahim28:8309507183isa@cluster0.pu6tzs4.mongodb.net/?appName=Cluster0';
const dbName = 'smartsyncDB';
let db;
let useMemoryStore = true;
let memoryDevices = [];
let memoryAlerts = [];

function getDefaultDevices() {
    return [
        { _id: 'dev-1', name: 'Front Door Camera', type: 'camera', isOn: true, ipAddress: '192.168.1.10' },
        { _id: 'dev-2', name: 'Living Room Lock', type: 'lock', isOn: false, ipAddress: '192.168.1.11' },
        { _id: 'dev-3', name: 'Smart Thermostat', type: 'thermostat', isOn: true, value: 22, ipAddress: '192.168.1.12' },
        { _id: 'dev-4', name: 'Bedroom Light', type: 'light', isOn: false, ipAddress: '192.168.1.13' }
    ];
}

function seedMemoryStore() {
    if (memoryDevices.length === 0) {
        memoryDevices = getDefaultDevices();
    }
}

function addAlert(message) {
    const now = new Date();
    memoryAlerts.unshift({
        _id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message,
        timestamp: now
    });
    memoryAlerts = memoryAlerts.slice(0, 50);
}

seedMemoryStore();

// Connect to MongoDB
MongoClient.connect(mongoURI)
    .then(client => {
        console.log('✅ Connected to MongoDB Successfully!');
        db = client.db(dbName);
        useMemoryStore = false;
        initializeDatabase(); // Populates initial data if empty
    })
    .catch(error => {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.warn('⚠️ Falling back to in-memory data store. Data will reset when server restarts.');
        useMemoryStore = true;
        seedMemoryStore();
    });

// --- API ENDPOINTS (HTTP Transactions - Unit I) ---

// 1. READ: Get all devices
app.get('/api/devices', async (req, res) => {
    try {
        if (useMemoryStore) {
            return res.json(memoryDevices);
        }
        const devices = await db.collection('devices').find().toArray();
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. UPDATE: Toggle a device's ON/OFF status
app.post('/api/devices/toggle', async (req, res) => {
    try {
        const { deviceId, newState, name } = req.body;

        if (useMemoryStore) {
            const device = memoryDevices.find(d => d._id === deviceId);
            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }
            device.isOn = newState;
            const statusText = newState ? 'turned ON' : 'turned OFF';
            addAlert(`${name} was ${statusText}.`);
            return res.json({ success: true });
        }
        
        await db.collection('devices').updateOne(
            { _id: new ObjectId(deviceId) },
            { $set: { isOn: newState } }
        );

        const statusText = newState ? 'turned ON' : 'turned OFF';
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        await db.collection('alerts').insertOne({
            time: now,
            message: `${name} was ${statusText}.`,
            timestamp: new Date()
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. READ: Get the latest alerts (Using limit and sort)
app.get('/api/alerts', async (req, res) => {
    try {
        if (useMemoryStore) {
            return res.json(memoryAlerts.slice(0, 5));
        }
        const alerts = await db.collection('alerts')
            .find()
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. CREATE: Add a new device
app.post('/api/devices', async (req, res) => {
    try {
        const newDevice = {
            name: req.body.name,
            type: req.body.type,
            ipAddress: req.body.ipAddress,
            isOn: false,
            value: req.body.type === 'thermostat' ? 21 : null
        };

        if (useMemoryStore) {
            const createdDevice = {
                ...newDevice,
                _id: `dev-${Date.now()}`
            };
            memoryDevices.push(createdDevice);
            addAlert(`New device added: ${newDevice.name}`);
            return res.json({ success: true, insertedId: createdDevice._id });
        }
        
        const result = await db.collection('devices').insertOne(newDevice);
        
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        await db.collection('alerts').insertOne({
            time: now, message: `New device added: ${newDevice.name}`, timestamp: new Date()
        });

        res.json({ success: true, insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. DELETE: Remove a device
app.delete('/api/devices/:id', async (req, res) => {
    try {
        const deviceId = req.params.id;

        if (useMemoryStore) {
            const before = memoryDevices.length;
            memoryDevices = memoryDevices.filter(device => device._id !== deviceId);
            if (memoryDevices.length === before) {
                return res.status(404).json({ error: 'Device not found' });
            }
            addAlert('A device was removed.');
            return res.json({ success: true });
        }

        await db.collection('devices').deleteOne({ _id: new ObjectId(deviceId) });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Helper function to insert dummy data if the database is empty
async function initializeDatabase() {
    const count = await db.collection('devices').countDocuments();
    if (count === 0) {
        await db.collection('devices').insertMany([
            { name: 'Front Door Camera', type: 'camera', isOn: true, ipAddress: '192.168.1.10' },
            { name: 'Living Room Lock', type: 'lock', isOn: false, ipAddress: '192.168.1.11' },
            { name: 'Smart Thermostat', type: 'thermostat', isOn: true, value: 22, ipAddress: '192.168.1.12' },
            { name: 'Bedroom Light', type: 'light', isOn: false, ipAddress: '192.168.1.13' }
        ]);
        console.log('Inserted default devices into MongoDB.');
    }
}