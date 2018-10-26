var app = require('./app');
var port = process.env.PORT || 3200;
var config = require('./config');
var express = require('express');
// var app = express();  
var server = require('http').createServer(app);  
var http = require("http").Server(express) 
server.listen(port, function() {
  console.log('Express server listening on port ' + port);
});