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

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  //create new guest name
  var name = 'Guest' + guestNumber;
  //associate guest name with client connection id
  nickNames[socket.id] = name;
  //tells the user their name
  socket.emit('nameResult', {
    success: true,
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

function handleNameChangeAttempts (sockets, nickNames, namesUsed) {
  //add listener for nameAttempt events
  socket.on('nameAttempt', function(name) {
    // dont allow nickname to begin with guest
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      //if name is not already registered, register it
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        //remove previous name to make it available to other clients
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        //send error to client if name is already registered
        socket.emit('nameResult', {
          success: false,
          message: "That name is already in use."
        });
      }
    }
  });
}

//sending chat messages
function handleMessageBroadcasting(socket) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  });
}


function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[namesIndex];
    delete nickNames[socket.id];
  });
}
