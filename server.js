require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const dbFilePath = path.join(__dirname, 'database.json');

class MongoLikeDB {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = this.read();
    }

    read() {
        try {
            if (fs.existsSync(this.filePath)) {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            }
        } catch (e) {
            console.error("Error reading DB:", e);
        }
        return {
            serverinfo: { correctversion: true, serverVersion: "1.0.6.0", ServerDevVersion: "0.0.0.1", IsOnline: true, IsDevOnline: false },
            players: {},
            inventories: {},
            characterslots: {},
            playerstats: {},
            rooms: []
        };
    }

    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (e) {
            console.error("Error saving DB:", e);
        }
    }

    findOne(collection, query) {
        if (!this.data[collection]) return null;
        if (Array.isArray(this.data[collection])) {
            return this.data[collection].find(item => {
                for (let k in query) {
                    if (item[k] !== query[k]) return false;
                }
                return true;
            }) || null;
        }
        const key = query.uid || query.discord_id;
        if (key) return this.data[collection][key] || null;
        return null;
    }

    updateOne(collection, query, updateData) {
        if (!this.data[collection]) this.data[collection] = {};
        const key = query.uid || query.discord_id;
        if (key) {
            if (!this.data[collection][key]) {
                this.data[collection][key] = { ...query, ...updateData };
            } else {
                this.data[collection][key] = { ...this.data[collection][key], ...updateData };
            }
            this.save();
            return this.data[collection][key];
        }
    }

    insert(collection, item) {
        if (!this.data[collection]) this.data[collection] = [];
        if (Array.isArray(this.data[collection])) {
            this.data[collection].push(item);
            this.save();
        }
    }
}

const db = new MongoLikeDB(dbFilePath);

app.use((req, res, next) => {
    console.log(`[Matchmaking-Request] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => res.send('HSHO Matchmaking Server Running'));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.all(['/serverinfo', '/*/serverinfo'], (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: db.data.serverinfo });
});

// ระบบ Authentication ผู้เล่น
app.all(['/live/player/authen', '/*/live/player/authen'], (req, res) => {
    const uid = req.body.uid || req.query.uid || req.body.discord_id || "default_user";
    let player = db.findOne('players', { uid });

    if (!player) {
        player = db.updateOne('players', { uid }, {
            token: "token_" + Math.random().toString(36).substring(7),
            uid: uid,
            name: req.body.name || "HSH_Player",
            level: 99,
            glory: 99999
        });
        db.updateOne('playerstats', { uid }, { level: 99, exp: 0, glory: 99999 });
        db.updateOne('inventories', { uid }, { items: [] });
        db.updateOne('characterslots', { uid }, { slots: [] });
    }

    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: { token: player.token, uid: uid, name: player.name }
    });
});

app.all(['/live/player/getdata', '/*/live/player/getdata'], (req, res) => {
    const uid = req.body.uid || req.query.uid || "default_user";
    let player = db.findOne('players', { uid }) || db.updateOne('players', { uid }, { uid, name: "HSH_Player", level: 99, glory: 99999 });
    res.json({ status: "success", code: 0, message: "OK", data: player });
});

// --- ระบบจัดการห้อง (Matchmaking Room System) ---

// 1. สร้างห้องใหม่
app.all(['/matchmaking/v1/room/create', '/*/matchmaking/v1/room/create'], (req, res) => {
    const roomName = req.body.roomName || req.query.roomName || "Private Room";
    const newRoom = {
        roomId: "room_" + Date.now(),
        roomName: roomName,
        ip: "127.0.0.1",
        port: 7777,
        currentPlayers: 1,
        maxPlayers: 5,
        hostUid: req.body.uid || req.query.uid || "host_user"
    };

    if (!db.data.rooms) db.data.rooms = [];
    db.insert('rooms', newRoom);

    res.json({
        status: "success",
        code: 0,
        message: "Room created successfully",
        data: newRoom
    });
});

// 2. ดึงรายการห้องทั้งหมด
app.all(['/matchmaking/v1/room/list', '/*/matchmaking/v1/room/list'], (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {
            rooms: db.data.rooms || []
        }
    });
});

// 3. เข้าร่วมห้อง
app.all(['/matchmaking/v1/room/join', '/*/matchmaking/v1/room/join'], (req, res) => {
    const roomId = req.body.roomId || req.query.roomId;
    let targetRoom = db.findOne('rooms', { roomId: roomId });

    if (!targetRoom && db.data.rooms && db.data.rooms.length > 0) {
        targetRoom = db.data.rooms[0]; // ถ้าหาไม่เจอ ให้เข้าห้องแรกที่มีอยู่สำรองไว้
    }

    res.json({
        status: "success",
        code: 0,
        message: "Joined room successfully",
        data: {
            roomId: targetRoom ? targetRoom.roomId : "room_default",
            ip: targetRoom ? targetRoom.ip : "127.0.0.1",
            port: targetRoom ? targetRoom.port : 7777
        }
    });
});

// ดักจับทุกเส้นทางที่เหลือเพื่อป้องกัน Error code = 0
app.all('*', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: {} });
});

app.listen(PORT, () => console.log(`Matchmaking Server running on port ${PORT}`));
