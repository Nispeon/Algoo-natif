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

    socket.on('createRoom', (room) => {
        let newRoom = {
            id: id,
            name: room.name,
            arrTime: room.arrTime,
            destination: {
                lat: null,
                lng: null,
            }
        }

        roomIds.push(id.toString());
        roomList[id] = newRoom;
        userList[id] = [];
        id++;
        io.emit('roomListUpdate', roomList);
    });

    socket.on('sendMessage', (roomId, username, msg, color) => {
        console.log('Room: ' + roomId + 'User: ' + username + ' Message: ' + msg + ' Color: ' + color);
        io.emit('dispatchMessage', roomId, username, msg, color);
    });

    socket.on('joinRoom', (roomId, username, color, location) => {
        console.log('Room: ' + roomId + ' User: ' + username);

        // check if roomId is in roomIds
        if (roomIds.includes(roomId)) {
            userList[roomId].push({
                username: username,
                color: color,
                ping: Date.now(),
                location: location,
            });
            console.log(userList);
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

    socket.on('ping', (roomId, username, location) => {
        userList[roomId].forEach(user => {
            if (user.username === username) {
                user.ping = Date.now();
                user.location = location;
            }
            // if last ping was more than 5 seconds ago, remove user from room
            if (Date.now() - user.ping > 6000) {
                userList[roomId] = userList[roomId].filter(u => u.username !== user.username);
            }
        });
        io.emit('updateUsers', roomId, userList[roomId]);
    })

    socket.on('setDestination', (roomId, destination) => {
        console.log('Room: ' + roomId + ' Destination: ' + destination);
        roomList[roomId].destination = destination;
        io.emit('updateDestination', roomId, destination);
    });

    socket.on('selectRestaurant', (roomId, username, restaurant) => {
        console.log('Room: ' + roomId + ' User: ' + username + ' Restaurant: ' + restaurant);
        // add restaurant to user
        userList[roomId].forEach(user => {
            if (user.username === username) {
                user.restaurant = restaurant;
            }
        });
        io.emit('updateUsers', roomId, userList[roomId]);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});