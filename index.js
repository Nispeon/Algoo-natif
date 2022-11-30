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

const restaurants = [
    {
        id: 1,
        name: 'Restaurant 1',
    },
    {
        id: 2,
        name: 'Restaurant 2',
    },
    {
        id: 3,
        name: 'Restaurant 3',
    },
    {
        id: 4,
        name: 'Restaurant 4',
    },
    {
        id: 5,
        name: 'Restaurant 5',
    },
    {
        id: 6,
        name: 'Restaurant 6',
    },
];

var roomList = [];
roomList[0] = {
    id: 0,
    name: 'Global',
    arrTime: '13:00',
};
var roomIds = ['0'];
var id = 1;

var userList = [];
userList[0] = [];


io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('getRooms', () => {
        io.emit('roomListUpdate', roomList);
    });

    io.emit('credentials', btoa(`${process.env.OPEN_STREET_MAP_USERNAME}:${process.env.OPEN_STREET_MAP_PASSWORD}`));

    socket.on('createRoom', (room) => {
        let newRoom = {
            id: id,
            name: room.name,
            arrTime: room.arrTime,
        }

        console.log(room.arrTime);

        roomIds.push(id);
        roomList[id] = newRoom;
        console.log(roomList);
        id++;
        io.emit('roomListUpdate', roomList);
    });

    socket.on('sendMessage', (roomId, username, msg, color) => {
        console.log('Room: ' + roomId + 'User: ' + username + ' Message: ' + msg + ' Color: ' + color);
        io.emit('dispatchMessage', roomId, username, msg, color);
    });

    socket.on('joinRoom', (roomId, username, color) => {
        console.log('Room: ' + roomId + ' User: ' + username);

        // check if roomId is in roomIds
        if (roomIds.includes(roomId)) {
            userList[roomId].push({username: username, color: color});
        }

        // these variables are only a fallback when someone joins an undefined room
        let roomInfo = roomList[roomId] !== undefined ? roomList[roomId] : null;
        let users = userList[roomId] !== undefined ? userList[roomId] : null;

        io.emit('dispatchJoinRoom', roomId, username, color, roomIds, roomInfo, users);
    });

    socket.on('leaveRoom', (roomId, username) => {
        console.log('User: ' + username + ' left room: ' + roomId);
        if (roomIds.includes(roomId)) {
            userList[roomId] = userList[roomId].filter(user => user.username !== username);
        }
        console.log(userList);
        io.emit('dispatchLeaveRoom', roomId, username, userList[roomId]);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
