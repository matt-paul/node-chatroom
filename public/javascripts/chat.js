var Chat = function(socket) {
  this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text) {
  var message = {
    room: room,
    text: text
  };
  this.socket.emit('message', message);
};


Chat.prototype.changeRoom = function(room) {
  this.socket.emit('join', {
    newRoom: room
  });
};

//processing chat commands
Chat.prototype.processCommand = function(command) {
  var words = command.split(' ');
  //parse command from the first word
  var command = words[0]
                   .substring(1, words[0].length)
                   .toLowerCase();
  var message = false;

  swich(command) {
    case 'join';
      words.shift();
      var room = words.join(' ');
      //Handle room changing/creation
      this.changeRoom(room);
      break;
    case 'nick';
      words.shift();
      var name = words.join(' ');
      //handle name change attempts
      this.socket.emit('nameAttempt', name);
      break;

   default:
      message  = 'Uncognized command.';
      break;
  }

  return message;
};
