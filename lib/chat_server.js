var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

//define chat server function 'listen', which is invoked in server.js
//establishes how each incoming connection should be handled

exports.listen = function(server) {
  io = socketio.listen(server);

  io.set('log level', 1);

  io.sockets.on('connection', function (socket) {

    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    joinRoom(socket, 'Lobby');

    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', function() {
      socket.emit('rooms', io.sockets.manager.rooms);

    });

    handleClientDisconnection(socket, nickNames, namesUsed);

  });

};

//helper methods

function assignGuestName(socket, guestNumber, nicknames, namesUsed) {
  //create new guest name
  var name = 'Guest' + guestNumber;
  //associate guest name with client connection id
  nickNames[socket.id] = name;
  //tells the user their name
  socket.emit('nameResult', {
    success: true;
    name: name
  });
  //note that guest name is now used
  namesUsed.push(name);
  //increments counter used to generate guest number
  return guestNumber + 1;
}


function joinRoom(socket, room) {
  socket.join(room);
  //note that user is now in this room
  currentRoom[socket.id] = room;
  //tell user about this
  socket.emit('joinResult', {room: room});
  //tell room that new user has joined
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });

//determine what other users are in the same room as user
  var usersInRoom = io.sockets.clients(room);
  //if other users exist, summarise who they are
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = "Users currently in ' + room + ': ";
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    //send summary of other users in the room to the user
    socket.emit('message', {text: usersInRoomSummary});
  }
}
