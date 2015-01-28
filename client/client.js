var masterBlock = null;
var block = null;

//Start Peer connection with peer broker
var peer = new Peer( {host: 'localhost', port: 9000, path: '/myapp'});

peer.on('open', function (id) {
  console.log('Connect with id:', id);

  //The peer broker does not support peer - server comunications,
  //so we use a websocket connection instead to get all peer ids
  var ws = new WebSocket("ws:localhost:9001");

  ws.onopen = function(event){
    ws.send(JSON.stringify({signal: 'id', id: id}));
  }

  //The peer broker will respond with a peerList
  //and the number of blocks needed
  ws.onmessage = function (msg) {
    console.log('Got Peer List');

    var data = JSON.parse(msg.data);

    console.log(data);

    console.log('Launching Master Block...');
    masterBlock = new MasterBlock(data);
    masterBlock.launch();

  }
});

//Handle peer to peer data channel
peer.on('connection', function (conn) {
  conn.on('data', function(data){
    data = JSON.parse(data);
    signal = data.signal;

    //Initial
    if (signal === 'i'){

      block = new Block(data);

      block.runPoisson();
    }
    //receiving boundary
    else if (signal === 'b') {

      console.log('receiving boundary')

    }
      //progress
    // } else if (signal === 'p') {
    //   var itt = data.itt;

    //   masterBlock.judgeConvergence(data.itt, data.peerId);
    // }

    // else if (signal === 's') {
    //   block.converged === true
    // }

  })
});