var masterBlock = null;
var block = null;

//Start Peer connection with peer broker
var peer = new Peer( {host: 'localhost', port: 9000, path: '/myapp'});

peer.on('open', function (id) {
  console.log('[CLIENT] Connect with id:', id);

  //The peer broker does not support peer - server comunications,
  //so we use a websocket connection instead to get all peer ids
  var ws = new WebSocket("ws:localhost:9001");

  ws.onopen = function(event){
    ws.send(JSON.stringify({signal: 'id', id: id}));
  }

  //The peer broker will respond with a peerList
  //and the number of blocks needed
  ws.onmessage = function (msg) {

    var data = JSON.parse(msg.data);

    console.log('[CLIENT] Launching Master Block...');
    masterBlock = new MasterBlock(data);
    masterBlock.launch();

  }
});

//Handle peer to peer data channel
peer.on('connection', function (conn) {
  conn.on('data', function(data){
    data = JSON.parse(data);

    switch(data.signal) {
    //[block] Initial
      case  'i':

        console.log('[CLIENT] Block init.');
        console.log(data)
        block = new Block(data);
        block.runPoisson();

        break;

      //[block] receiving boundary
      case 'b':

        console.log('[CLIENT] Block received a boundary from: ', conn.peer);

        block.updateBoundaries(data);
        block.runPoisson();
        break;

      //[master] progress
      case 'p':

        console.log('[CLIENT] Master Block judges convergence.');

        data.peerId = conn.peer;
        masterBlock.judgeConvergence(data);

        break;

      //[block]
      case 's':
        console.log('[CLIENT] Block is converged.');

        block.emitFields();

        break;
      //[block]
      case 'c': //c => signal block to proceed with iterations

        console.log('[CLIENT] Block proceeding with iteration');
        block.switchSignal();
        block.runPoisson();
        break;
    }


  })
  peer.on('disconnected', function() {
    console.log('[DISCONNECT] Peer disconected from the signaling server.')
  });

  peer.on('error', function() {
    console.log('[ERROR] Peer error.')
  });
});

