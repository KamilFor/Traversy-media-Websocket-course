const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

// import utils
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome information
    socket.emit('message', formatMessage(botName, 'Welcome to ChatChord!'));

    // Brodcast when a user connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `A ${user.username} has joined the chat`));

    //Send Users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    // UserLeave
    const user = userLeave(socket.id);

    console.log(user);
    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `A ${user.username} has left the chat`));
      //Send Users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server runing on port ${PORT}`));
