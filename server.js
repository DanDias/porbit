var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var server;
if (port == 443)
    server = require('https').Server(app);
else
    server = require('http').Server(app);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(port,function(){ // Listens
    console.log('Listening on '+server.address().port);
});