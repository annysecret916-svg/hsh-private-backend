require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const dbFilePath = path.join(__dirname, 'database.json');

function loadDatabase() {
    try {
        if (fs.existsSync(dbFilePath)) {
            const data = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
            if (!data.serverinfo) {
                data.serverinfo = {
                    correctversion: true,
                    serverVersion: "1.0.6.0",
                    ServerDevVersion: "0.0.0.1",
                    IsOnline: true,
                    IsDevOnline: false
                };
            }
            if (!data.players) data.players = {};
            if (!data.rooms) data.rooms = [];
            return data;
        }
    } catch (err) {
        console.error('Error reading database file:', err);
    }
    
    return {
        serverinfo: {
            correctversion: true,
            serverVersion: "1.0.6.0",
            ServerDevVersion: "0.0.0.1",
            IsOnline: true,
            IsDevOnline: false
        },
        players: {},
        rooms: [],
        inventories: {},
        characterslots: {},
        playerstats: {}
    };
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing database file:', err);
    }
}

let db = loadDatabase();

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.status(200).send('HSHO Private Server Online');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// รองรับทั้ง /serverinfo และ api variations
app.all(['/serverinfo', '/*/serverinfo'], (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: db.serverinfo
    });
});

app.all('/live/player/authen', (req, res) => {
    const uid = req.body.uid || req.query.uid || "user_" + Date.now();
    
    if (!db.players[uid]) {
        db.players[uid] = {
            token: "mock_token_" + Math.random().toString(36).substring(7),
            uid: uid,
            name: req.body.name || "HSH_Player",
            level: 99,
            glory: 99999
        };
        saveDatabase(db);
    }

    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {
            token: db.players[uid].token,
            uid: uid,
            name: db.players[uid].name,
            level: 99,
            exp: 0
        }
    });
});

app.all('/live/player/gameplay/checkversion', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: { latestVersion: true } });
});

app.all('/live/player/inventory/getAll', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: { items: [] } });
});

app.all('/live/player/curserelic/get', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: { relics: [] } });
});

app.all('/live/player/characterslot/get', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: { slots: [] } });
});

app.all('/live/player/playerstat/get', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: { level: 99, exp: 0, glory: 99999 } });
});

app.all('/live/player/getban', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: { isBan: false } });
});

// ดักจับทุกเส้นทาง API ของเกมเพื่อป้องกัน Error code = 0 แบบเบ็ดเสร็จ
app.all('*', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {}
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
