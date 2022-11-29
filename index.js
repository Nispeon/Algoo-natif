const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});

app.get('/room', (req, res) => {
    res.sendFile(__dirname + '/templates/room.html');
});

io.on('connection', (socket) => {
    console.log('New user connected');

    io.emit('credentials', btoa(`${process.env.OPEN_STREET_MAP_USERNAME}:${process.env.OPEN_STREET_MAP_PASSWORD}`));

    let roomList = [];
    let id = 0;

    socket.on('createRoom', (room) => {
        let newRoom = {
            id: id,
            name: room.name,
            arrTime: room.arrTime,
        }
        roomList.push(newRoom);
        id++;
        io.emit('roomListUpdate', roomList);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
