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
        io.emit('dispatchMessage', roomId, username, msg, color);
    });

    socket.on('joinRoom', (roomId, username, color, location) => {
        if (roomIds.includes(roomId)) {
            userList[roomId].push({
                username: username,
                color: color,
                ping: Date.now(),
                location: location,
                time: null,
                distance: null,
            });
        }

        // these variables are only a fallback when someone joins an undefined room
        let roomInfo = roomList[roomId] !== undefined ? roomList[roomId] : null;
        let users = userList[roomId] !== undefined ? userList[roomId] : null;

        io.emit('dispatchJoinRoom', roomId, username, color, roomIds, roomInfo, users);
    });

    socket.on('leaveRoom', (roomId, username) => {
        if (roomIds.includes(roomId)) {
            userList[roomId] = userList[roomId].filter(user => user.username !== username);
        }
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
        io.emit('updateUsers', roomId, userList[roomId], roomList[roomId]);
    })

    socket.on('setDestination', (roomId, destination) => {
        roomList[roomId].destination = destination;
        io.emit('updateDestination', roomId, destination);
    });

    socket.on('selectRestaurant', (roomId, username, restaurant) => {
        userList[roomId].forEach(user => {
            if (user.username === username) {
                user.restaurant = restaurant;
            }
        });
        io.emit('updateUsers', roomId, userList[roomId], roomList[roomId]);
    });

    socket.on('updateUsersTimeDistance', (roomId, usersTimeDistance) => {
        usersTimeDistance.forEach(user => {
            userList[roomId].forEach(u => {
                if (u.username === user.username) {
                    u.time = user.time;
                    u.distance = user.distance;
                }
            });
        });
    })
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
