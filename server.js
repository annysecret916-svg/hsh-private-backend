require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const dbFilePath = path.join(__dirname, 'database.json');

// ระบบจำลองฐานข้อมูล MongoDB บนไฟล์ JSON
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
}

const db = new MongoLikeDB(dbFilePath);

app.use((req, res, next) => {
    console.log(`[HSH-Request] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => res.send('HSHO Server Running'));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.all(['/serverinfo', '/*/serverinfo'], (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: db.data.serverinfo });
});

// Endpoint สำคัญ: ถ้าไม่มีข้อมูลผู้เล่นใน database.json ระบบจะสร้างให้ทันทีเพื่อกัน Error 0
app.all(['/live/player/authen', '/*/live/player/authen'], (req, res) => {
    const uid = req.body.uid || req.query.uid || req.body.discord_id || "default_user";
    let player = db.findOne('players', { uid });

    if (!player) {
        player = db.updateOne('players', { uid }, {
            token: "token_" + Math.random().toString(36.substring(7)),
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

app.all(['/live/player/inventory/getAll', '/*/live/player/inventory/getAll'], (req, res) => {
    const uid = req.body.uid || req.query.uid || "default_user";
    const inv = db.findOne('inventories', { uid }) || { items: [] };
    res.json({ status: "success", code: 0, message: "OK", data: inv });
});

app.all(['/live/player/playerstat/get', '/*/live/player/playerstat/get'], (req, res) => {
    const uid = req.body.uid || req.query.uid || "default_user";
    const stats = db.findOne('playerstats', { uid }) || { level: 99, exp: 0, glory: 99999 };
    res.json({ status: "success", code: 0, message: "OK", data: stats });
});

// ดักจับทุกเส้นทางที่เหลือเพื่อกันหลุดและกัน Error code = 0
app.all('*', (req, res) => {
    res.json({ status: "success", code: 0, message: "OK", data: {} });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
