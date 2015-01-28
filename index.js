var Poisson = require('./lib/poisson');
var PeerServer = require('peer').PeerServer;
var WebSocketServer = require('ws').Server;

//Number of blocks
// min: 2x2
var blockRows = 2;
var blockCols = 2;
var nd = blockRows*blockCols;

var peerServer = PeerServer({port: 9000, path: '/myapp'});
var wss = new WebSocketServer({port: 9001});
var peerList = new Array();
var masterSocket = null;

//Listen for peer connections
peerServer.on('connection', function (id) {
  console.log('Peer connected with id:', id);
});


//Listen for ws connections
wss.on('connection', function(socket) {
  socket.on('message', function(msg){
    msg = JSON.parse(msg);

    if (msg.signal ==='id'){
      peerList.push(msg.id);

      //First socket is master socket
      if (!masterSocket){
        masterSocket = socket;
      }

      if ( peerList.length === (nd + 1)) {
        console.log('Launching Master...')
        masterSocket.send(JSON.stringify({peerList: peerList, blockRows: blockRows, blockCols: blockCols}));
      }
    }

    else if (msg.signal === 'block-field') {
      console.log('field')
      var poisson = new Poisson(msg.conditions);
      poisson.print('./field' + msg.blocks[0] + msg.blocks[1] + '.txt', msg.field);
    }



  });
});