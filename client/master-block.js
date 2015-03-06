//stop criteria
var RESSTOP = 1E-9;

var MasterBlock = function (opts) {

  if (opts.peerList.length < opts.blockRows*opts.blockCols) {
    throw 'You need more ' + (opts.blockRows*opts.blockCols - opts.peerList.length) + ' peers';
  }

  this.converged = false;
  this.map = null;
  this.connections = {};
  this.peerList = opts.peerList;
  this.blockRows = opts.blockRows;
  this.blockCols = opts.blockCols;
  this.n = opts.n;
  this.m = opts.m;
  this.connCountDown = opts.blockRows * opts.blockCols;
  this.blockCountDown = opts.blockRows * opts.blockCols;

  that = this;

  this.initMap();

  for (var i = 0; i < this.peerList.length; i++) {
    var peerId = this.peerList[i];
    var conn = peer.connect(peerId);
    this.connections[peerId] = conn;
    conn.on('open', function () {
      if (!--that.connCountDown) {
        that.launch();
      }
    });

    conn.on('close', function () {
      throw 'Connection to peer closed.';
    });

    conn.on('error', function (err) {
      throw 'Error on peer connection:' + err;
    });

  }

};

var i = 0;
MasterBlock.prototype.judgeConvergence = function (data){

  if ( ++i%100 === 0) {
    console.log('[MASTER] Outer iteration:', data.outer, 'Inner Iterarion:', data.itt, 'res:', data.res);
  }

  //Stop when first block converges
  var peerId, conn;

  if ( data.res < RESSTOP ) {

    //Signal peers to emit fields
    if (!this.converged) {
      for (peerId in this.connections) {
        this.converged = true;
        conn = this.connections[peerId];
        emitSignal(conn, 's');
        console.log('[MASTER] signalling stop');
      }
    }


  } else {

    //will wait for all blocks to
    if (--this.blockCountDown === 0) {
      this.resetBlockCountDown();

      // console.log('[MASTER] signalling continue');

      //send signal to run another iteration
      //this acts as a sync stage. Blocks can't run asynchronously to each other
      for (peerId in this.connections) {
        conn = this.connections[peerId];
        emitSignal(conn, 'c');
      }

    }
  }

  function emitSignal(connection, signal) {
      var data = { signal: signal };
      connection.send(JSON.stringify(data));
  }

};

MasterBlock.prototype.resetBlockCountDown = function () {
  this.blockCountDown = this.blockRows * this.blockCols;
};

MasterBlock.prototype.launch = function (){

  this.converged = false;
  this.resetBlockCountDown();

  for (var by = 0; by < this.map.length; by++) {
    for (var bx = 0; bx < this.map[0].length; bx++) {

      var pId = this.map[by][bx];
      var conn = this.connections[pId];

      var that = this;

      (function (blocks, connection) {
        // connection.on('open', function(){

          var data = { 
            signal: 'i',
            bRow: blocks[0],
            bCol: blocks[1],
            bRows: that.map.length, 
            bCols: that.map[0].length
          };

          data.masterId = peer.id;
          data.blocks = blocks;
          data.map = that.map;

          if (isBoundaryBlockY(blocks)){
            data.h = 1;
            data.n = that.n; 
            data.bc = {
              E: that.buildBoundary(0, that.n + 1),
              W: that.buildBoundary(0, that.n + 1)
            };
          } //else {
          //   data.h = 1/that.map.length * (1 + 2/n);
          //   data.n = n + 2;
          //   data.bc = {
          //     E: that.buildBoundary(0, n + 2),
          //     W: that.buildBoundary(0, n + 2)
          //   };
          // }
          //Is this a boundary block in x?
          if (isBoundaryBlockX(blocks)){
            data.w = 1;
            data.m = that.m;

            data.bc.N = that.buildBoundary(0, that.m + 1);
            data.bc.S = that.buildBoundary(0, that.m + 1);

          } 
          // else {
          //   data.w = 1/that.map[0].length * (1 + 2/m);
          //   data.m = m + 2;

          //   data.bc.N = that.buildBoundary(0, m + 2);
          //   data.bc.S = that.buildBoundary(0, m + 2);
          // }

          connection.send(JSON.stringify(data));
        // });
      })([by,bx], conn);
    }
  }

  function isBoundaryBlockY(blocks) {
    return blocks[0] === 0 || blocks[0] === that.map.length - 1;
  }

  function isBoundaryBlockX(blocks) {
    return blocks[1] === 0 || blocks[1] === that.map[0].length - 1;
  }
};

MasterBlock.prototype.buildBoundary = function (value, size){
  var array = new Array(size);
  for (var i = 0; i < array.length; i++) {
    array[i] = value;
  }
  return array;
};

MasterBlock.prototype.initMap = function () {

  var map = new Array(this.blockRows);
  for (var row = 0; row < this.blockRows; row ++) {
      map[row] = new Array(this.blockCols);
  }

  var i = 0;
  for (row = 0; row < this.blockRows; row++) {
    for (col = 0; col < this.blockCols; col++) {
      map[row][col] = this.peerList[i++];
    }
  }

  this.map = map;
};