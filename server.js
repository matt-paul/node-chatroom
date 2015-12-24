var http = require('http');

var fs = require('fs');

var path = require('path');

var mime = require('mime');

var cache = {};

//3 helper functions used for serving static http files

//handles sending of 404 errors if requested file is not available
function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

//serves file data.  Writes the appropriate http headers, and then sends the contents of the file
function sendFile(response, filePath, fileContents) {
  response.writeHead (
    200,
    {"content-type" : mime.lookup(path.basename(filePath))}
  );
  response.end(fileContents);
}

//determines whether or not the file is cached, and if so serves it. If not, read from disk and serves.  If the file doesnt exist, function returns 404
function serveStatic(response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
   });
  }
}

//create http server
var server = http.createServer(function(request, response) {
  var filePath = false;

  if(request.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  serveStatic(response, cache, absPath);
});

//start server and listen on port 3000
server.listen(3000, function() {
  console.log("Server listening on port 3000.");
});


//getting socket.io going, see chat_Server.js
var charServer = require('./lib/chat_server');
chatServer.listen(server);
