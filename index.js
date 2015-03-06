var http = require('http');
var express = require('express');
var ExpressPeerServer = require('peer').ExpressPeerServer;
var _ = require('underscore');

var app = express();
var server = http.createServer(app);

var options = {
    debug: true,
    allow_discovery: true
};
var expressPeerServer = ExpressPeerServer(server, options);

app.use('/api', expressPeerServer);

app.use('/:prefix', express.static(__dirname + '/client'));

//List peer ids according to their prefixs
// someprefix: [ 
//   'default-4a78940f2f1f8b03195103a3baafc0db1425405629865787',
//   'default-4a78940f2f1f8b03195103a3baafc0db1425405629865787'
// ]
// otherexperiment: [ 
//   'otherexperiment-4a78940f2f1f8b03195103a3baafc0db1425405629865787',
//   'otherexperiment-4a78940f2f1f8b03195103a3baafc0db1425405629865787'
// ]
app.use('/list/:prefix', function (req, res) {

  var peers = expressPeerServer._clients.peerjs;

  if (!peers) 
    return res.json([]);

  var peersKeys = Object.keys(peers); 
  var requestPeers = [];

  var prefix = req.params.prefix; 

  _.filter(peersKeys, function (peerId) {
    var peerPrefix = getPrefix(peerId);

    if (peerPrefix === prefix)
      requestPeers.push(peerId);
  });

  res.json(requestPeers);

});

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";  
server.listen(port, ip, function () {
  console.log('Poisson WebRTC live at', port);   
});

expressPeerServer.on('connection', function (id) {
  console.log('Peer connected with id:', id); 
});

expressPeerServer.on('disconnect', function (id) {
  console.log('Peer %s disconnected', id);
});

function getPrefix(id){
  return id.split('-')[0];  
}