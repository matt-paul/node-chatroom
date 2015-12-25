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
    $('messages').append(divEscapedContentElement(message));
    $('messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#send-message').val('');
}
