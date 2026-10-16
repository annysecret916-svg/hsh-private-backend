require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const dbFilePath = path.join(__dirname, 'database.json');

// ระบบโหลดฐานข้อมูลจากไฟล์ database.json
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

// Debug Request Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.status(200).send('Home Sweet Home Online Private Server (JSON Storage) is Running & Healthy!');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime(), dbType: "JSON File" });
});

// Endpoint เช็กเวอร์ชันและข้อมูลเซิร์ฟเวอร์
app.all('/serverinfo', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: db.serverinfo
    });
});

// Endpoint สำหรับให้ Launcher ดึงข้อมูลผู้เล่นไปแสดงผล
app.all('/live/player/getdata', (req, res) => {
    const uid = req.body.uid || req.query.uid || "default_user";
    
    if (!db.players[uid]) {
        db.players[uid] = {
            uid: uid,
            name: "HSH_Player",
            level: 99,
            glory: 99999,
            createdAt: new Date().toISOString()
        };
        saveDatabase(db);
    }

    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: db.players[uid]
    });
});

// ระบบยืนยันตัวตนและสร้างข้อมูลผู้เล่นอัตโนมัติ (ป้องกัน Error code = 0)
app.all('/live/player/authen', (req, res) => {
    const uid = req.body.uid || req.query.uid || "user_" + Date.now();
    
    if (!db.players[uid]) {
        db.players[uid] = {
            token: "mock_token_" + Math.random().toString(36).substring(7),
            uid: uid,
            name: req.body.name || "HSH_Player",
            level: 99,
            glory: 99999,
            createdAt: new Date().toISOString()
        };
        db.playerstats = db.playerstats || {};
        db.playerstats[uid] = { level: 99, exp: 0, glory: 99999 };
        db.inventories = db.inventories || {};
        db.inventories[uid] = { items: [] };
        db.characterslots = db.characterslots || {};
        db.characterslots[uid] = { slots: [] };
        saveDatabase(db);
    }

    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {
            token: db.players[uid].token,
            uid: uid,
            name: db.players[uid].name
        }
    });
});

app.all('/live/player/gameplay/checkversion', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: { latestVersion: true } });
});

app.all('/live/player/inventory/getAll', (req, res) => {
    const uid = req.body.uid || req.query.uid || "default_user";
    const items = (db.inventories && db.inventories[uid]) ? db.inventories[uid].items : [];
    res.json({ status: "success", code: 0, data: { items: items } });
});

app.all('/live/player/curserelic/get', (req, res) => {
    res.json({ status: "success", code: 0, data: { relics: [] } });
});

app.all('/live/player/characterslot/get', (req, res) => {
    const uid = req.body.uid || req.query.uid || "default_user";
    const slots = (db.characterslots && db.characterslots[uid]) ? db.characterslots[uid].slots : [];
    res.json({ status: "success", code: 0, data: { slots: slots } });
});

app.all('/live/player/characterslot/edit', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/player/playerstat/get', (req, res) => {
    const uid = req.body.uid || req.query.uid || "default_user";
    const stats = (db.playerstats && db.playerstats[uid]) ? db.playerstats[uid] : { level: 99, exp: 0, glory: 99999 };
    res.json({ status: "success", code: 0, data: stats });
});

app.all('/live/player/getban', (req, res) => {
    res.json({ status: "success", code: 0, data: { isBan: false } });
});

app.all('/live/player/profile/edit', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/player/sticker/edit', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/player/gameplay/endgameresult', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/productlisting/list', (req, res) => {
    res.json({ status: "success", code: 0, data: { list: [] } });
});

app.all('/live/item/listall', (req, res) => {
    res.json({ status: "success", code: 0, data: { items: [] } });
});

app.all('/live/store/list', (req, res) => {
    res.json({ status: "success", code: 0, data: { stores: [] } });
});

app.all('/live/store/productlisting/list/tag', (req, res) => {
    res.json({ status: "success", code: 0, data: { list: [] } });
});

app.all('/live/immortal/player/get', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/immortal/player/getmatch', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/immortal/get', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/bonus/api/get_bonus_data', (req, res) => {
    res.json({ status: "success", code: 0, data: { bonus: [] } });
});

app.all('/live/mailbox/get', (req, res) => {
    res.json({ status: "success", code: 0, data: { mails: [] } });
});

app.all('/live/gacha/static/api/banner', (req, res) => {
    res.json({ status: "success", code: 0, data: { banners: [] } });
});

app.all('/live/treasure/api/progress/get', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/logapi/v1/check/penalty', (req, res) => {
    res.json({ status: "success", code: 0, data: { penalty: false } });
});

app.all('/logapi/v1/add/matchlog', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/logapi/v1/add/ingame', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/logapi/v1/add/errorlog', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/logapi/v1/check/serverdetect', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/matchmaking/v1/room/create', (req, res) => {
    const newRoom = {
        roomId: "room_" + Date.now(),
        roomName: req.body.roomName || "Private Room",
        ip: "127.0.0.1",
        port: 7777,
        currentPlayers: 1,
        maxPlayers: 5
    };
    db.rooms.push(newRoom);
    saveDatabase(db);

    res.json({
        status: "success",
        code: 0,
        message: "Room created successfully",
        data: newRoom
    });
});

app.all('/matchmaking/v1/room/list', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: { rooms: db.rooms }
    });
});

app.all('/matchmaking/v1/room/join', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "Joined room successfully",
        data: {
            roomId: req.body.roomId || "room_999",
            ip: "127.0.0.1",
            port: 7777
        }
    });
});

// ดักจับทุก Request ที่เหลือเพื่อป้องกันเกมขึ้น Error code = 0
app.all('*', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {}
    });
});

app.listen(PORT, () => {
    console.log(`Server running successfully using local JSON storage on port ${PORT}`);
});
