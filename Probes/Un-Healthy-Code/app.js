const http = require('http');
const os = require('os');
console.log("My NodeJS server starting...");
var requestCount = 0;

var handler = function(request, response) {
console.log("Received request from " + request.connection.remoteAddress);
requestCount++;
  if (requestCount > 5) {
    response.writeHead(500);
    response.end("Going Down!! Please restart me now!!");
    return;
  }
response.writeHead(200);
response.end("Hostname : " + os.hostname() + "\n");
};
var www = http.createServer(handler);
www.listen(8080);