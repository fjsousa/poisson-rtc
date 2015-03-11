//Global var
var masterBlock = null;
var block = null;
var peer;

//Timer
var ts, tf;

//Outer stop criteria
var RESSTOP = 1E-9;

//Prefix of the experiment
var prefix = window.location.pathname;

var AllPeers = function (){

  var that = this;

  this.update = function (cb) {
    $.get('/list'+ prefix, function(peers){

      //remove master Id from peer list
      var i = peers.indexOf(peer.id);
      peers.splice(i, 1);
      that.list = peers;

      cb(peers);
    });
  };

};

new Fingerprint2().get(onFingerPrint);

function onFingerPrint(fp){
  
  try {
    createPeer(fp);
  }
  catch (e) {
    console.error(e);
  }

}

function createPeer(fingerprint) {

  //5000 - development
  //80 - produtcion
  var port = (location.hostname === 'localhost') ? 8080 : 8000;

  //Connect to signalling server
  console.log('[CLIENT] Creating peer');

  peer = new Peer(createPId(prefix, fingerprint), {host: location.hostname, port: port, path: '/api'});

  //Handle peer to peer data channel
  peer.on('connection', function (conn) {
    // conn.on('open', function () {
      conn.on('data', function (data) {

          data = JSON.parse(data);

          switch(data.signal) {
          //[block] Initial
            case  'i':

              console.log('[CLIENT] Block init.');
              block = new Block(data);
              block.runPoisson();

              break;

            //[block] receiving boundary
            case 'b':

              // console.log('[CLIENT] Block received a boundary from: ', conn.peer, Date.now());

              block.updateBoundaries(data);
              break;

            //[master] progress
            case 'p':

              // console.log('[CLIENT] Master Block judges convergence.');

              // data.peerId = conn.peer;
              masterBlock.judgeConvergence(data);

              break;

            //[block]
            case 's':
              console.log('[CLIENT] Block is converged.');

              block.emitFields();

              break;
            //[block]
            case 'c': //c => signal block to proceed with iterations

              // console.log('[CLIENT] Proceed signal');
              block.runPoisson();
              break;

            case 'f': //f => master receives a worker peer field
              masterBlock.downloadLink(data);
              break;

            case 'r':
              location.reload();
              break;
          }


        });
    // });  
  });


  peer.on('disconnected', function() {
    console.log('[DISCONNECT] Peer disconected from the signaling server.');
    peer.reconnect();
  });

  peer.on('error', function(err) {
    console.log('[ERROR] Peer error:',err.type);
  });

  peer.on('close', function (){
    console.log('[PEER CLOSE]');
  });

  peer.on('open', function (id) {
    console.log('[CLIENT] Connect with id:', id);
  });

}

function createPId (namespace, fp) {
  
  if (typeof namespace !== 'string') 
    throw 'namespace should be a string.';

  if (namespace === '/') 
    namespace = '/default/';

  if (typeof fp !== 'string') 
    throw 'Finger print format is not a string.';

  if ( fp === null) 
    throw 'Finger print is null.';

  if ( fp === undefined) 
    throw 'Finger print is undefined.';
 
  var prefix = namespace.split('/')[1];

  if (/^[A-Za-z0-9_.]+$/.test(prefix)) {
    var id = prefix + '-' + fp + Date.now() + Math.floor( Math.random()*1000);
    return id;        
  } else {
    throw 'Prefix not supported. Only letters  \'a\' to \'z\' ';
  } 
}