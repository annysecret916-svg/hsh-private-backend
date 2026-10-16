const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('Home Sweet Home Online Private Server is running!');
});

app.all('/live/player/authen', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {
            token: "mock_token_12345",
            uid: "123456789"
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
    res.json({
        status: "success",
        code: 0,
        message: "Room created successfully",
        data: {
            roomId: "room_999",
            roomName: "Private Room",
            ip: "127.0.0.1",
            port: 7777
        }
    });
});

app.all('/matchmaking/v1/room/list', (req, res) => {
    res.json({
        status: "success",
        code: 0,
        message: "OK",
        data: {
            rooms: [
                {
                    roomId: "room_999",
                    roomName: "Private Room",
                    hostName: "Host",
                    currentPlayers: 1,
                    maxPlayers: 5,
                    ip: "127.0.0.1",
                    port: 7777
                }
            ]
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
