const express = require('express');
const https =  require('https');
const http = require('http');

var app = express();
var port = process.env.PORT || 8080;
var server;
if (port == 443)
    server = https.Server(app);
else
    server = http.Server(app);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/dist',express.static(__dirname + '/dist'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(port,function(){ // Listens
    console.log('Listening on '+server.address().port);
});