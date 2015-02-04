//stop criteria
var ITTSTOP = 1;

//core resolution, number of rows and cols
var n = 20;
var m = 20;

var MasterBlock = function (opts) {
  this.converged = false;
  this.map = null;
  this.connections = {};
  this.peerList = opts.peerList;
  this.blockRows = opts.blockRows;
  this.blockCols = opts.blockCols;
  this.connCountDown = opts.blockRows * opts.blockCols;
  this.blockCountDown = opts.blockRows * opts.blockCols;

  that = this;


  this.initMap();

  for (var i = 1; i < this.peerList.length; i++) {
    var peerId = this.peerList[i];
    var conn = peer.connect(peerId);
    this.connections[peerId] = conn;
    conn.on('open', function () {
      if (!--that.connCountDown) {
        that.launch();
      }
    });
  }

};

MasterBlock.prototype.judgeConvergence = function (data){

  //Stop when first block converges
  var peerId, conn;
  if ( data.itt < ITTSTOP ) {

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

      console.log('[MASTER] signalling continue');

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

          var data = { signal: 'i' };

          data.masterId = that.peerList[0];
          data.blocks = blocks;
          data.map = that.map;

          if (isBoundaryBlockY(blocks)){
            data.h = 1/that.map.length * (1 + 1/n);
            data.n = n + 1;
            data.bc = {
              E: that.buildBoundary(0, n + 1),
              W: that.buildBoundary(0, n + 1)
            };
          } else {
            data.h = 1/that.map.length * (1 + 2/n);
            data.n = n + 2;
            data.bc = {
              E: that.buildBoundary(0, n + 2),
              W: that.buildBoundary(0, n + 2)
            };
          }
          //Is this a boundary block in x?
          if (isBoundaryBlockX(blocks)){
            data.w = 1/that.map[0].length * (1 + 1/m);
            data.m = m + 1;

            data.bc.N = that.buildBoundary(0, n + 1);
            data.bc.S = that.buildBoundary(0, n + 1);

          } else {
            data.w = 1/that.map[0].length * (1 + 2/m);
            data.m = m + 2;

            data.bc.N = that.buildBoundary(0, n + 2);
            data.bc.S = that.buildBoundary(0, n + 2);
          }

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

  var i = 1;
  for (row = 0; row < this.blockRows; row++) {
    for (col = 0; col < this.blockCols; col++) {
      map[row][col] = this.peerList[i++];
    }
  }

  this.map = map;
};