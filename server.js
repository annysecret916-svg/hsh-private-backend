require('module-alias/register');
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('./src/config/index.js');
const routes = require('./src/routes/index.js');
const Health = require('./src/Health');

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const dbFilePath = path.join(__dirname, 'database.json');

function loadDatabase() {
    try {
        if (fs.existsSync(dbFilePath)) {
            return JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading database file:', err);
    }
    return { players: {}, rooms: [] };
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
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

app.use('/', routes);
app.use('/', Health);

app.all('/live/player/authen', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {
            token: "mock_token_12345",
            uid: "123456789",
            name: "Player"
        }
    });
});

app.all('/live/player/gameplay/checkversion', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {
            latestVersion: true
        }
    });
});

app.all('/live/player/inventory/getAll', (req, res) => {
    res.json({ status: "success", code: 0, data: { items: [] } });
});

app.all('/live/player/curserelic/get', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/player/characterslot/get', (req, res) => {
    res.json({ status: "success", code: 0, data: { slots: [] } });
});

app.all('/live/player/characterslot/edit', (req, res) => {
    res.json({ status: "success", code: 0, data: {} });
});

app.all('/live/player/playerstat/get', (req, res) => {
    res.json({ status: "success", code: 0, data: { level: 99, exp: 0 } });
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
    res.json({ status: "success", code: 0, data: {} });
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
    res.json({ status: "success", code: 0, data: {} });
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
        data: {
            rooms: db.rooms
        }
    });
});

app.all('/matchmaking/v1/room/join', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "Joined room successfully",
        data: {
            roomId: "room_999",
            ip: "127.0.0.1",
            port: 7777
        }
    });
});

app.all('*', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {}
    });
});

async function start() {
  try {
    await mongoose.connect(config.mongo.uri, {
      dbName: config.mongo.dbName,
    });
    console.log(`MongoDB connected to: ${config.mongo.dbName}`);

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.env}`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    await mongoose.connection.close();
    console.log('Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
