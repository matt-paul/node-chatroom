function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
  var message = $('#send-message').val();
  var systemMessage;
// if user input begins with a slash, treat it as a command
  if (message.charAt(0) == '/') {
    systemMessage = chatApp.processCommand(message);
    if(systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    //broadcast non command input to other users
    chatApp.sendMessage($('#room').text(), message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
  var chatApp = new Chat(socket);

//displays result of a name-change attempt
  socket.on('nameResult', function () {
    var message;

    if (result.success) {
      message = 'You are now known as' + result.name + '.';
    } else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });

//displays results of a room change
  socket.on('joinResult', function(result) {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

// display received messages
socket.on('message', function(message) {
  var newElement = $('<div></div>').text(message.text);
  $('#messages').append(newElement);
});

//display list of rooms available
socket.on('rooms', function(rooms) {
  $('#room-list').empty();

  for(var room in rooms) {
    room = room.substring(1, room.length);
    if (room != '') {
      $('#room-list').append(divEscapedContentElement(room));
    }
  }

//allow click of a room name to change to that room
  $('#room-list div').click(function() {
    chatApp.processCommand('/join ' + $(this).text());
    $('#send-message').focus();
  });
});

  //request list of rooms available intermittently
  setInterval(function() {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  //allow submitting the form to send a chat message
  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});
