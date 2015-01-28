var ws = new WebSocket("ws:localhost:9001");
var Poisson = require('poisson');

var Block = function (opts) {
  this.bc = opts.bc;
  this.conditions = { w: opts.w, h: opts.h, n: opts.n, m: opts.m }
  this.peerId = null;
  this.map = opts.map;
  this.blockRows = null;
  this.blockCols = null;
  this.by = opts.blocks[0];
  this.bx = opts.blocks[1];
  this.converged = false;
  this.maxItt = 1000000;
  this.maxRes = 1E-9;
  this.poisson = null;
  this.connections = {};
};

Block.prototype.runPoisson = function(){

  if (!this.poisson) {
    var bc = this.bc;
    this.poisson = new Poisson(this.conditions);
    this.poisson.setBoundaryConditions(bc.N, bc.S, bc.E, bc.W);
    var itt = this.poisson.solver(block.maxItt, block.maxRes);

    this.emit();

      // var msg = {
      //   signal: 'block-field',
      //   conditions: { w: data.w, h: data.h, n: data.n, m: data.m },
      //   blocks: data.blocks,
      //   field: poisson.u.new
      // };
      // ws.send(JSON.stringify(msg));



    // block.notifyMaster(itt, this.peerId);

  }

}

Block.prototype.emit = function () {

  var that = this;

  if (this.isBoundaryBlockY()) {
    var boundary;
    var peerBlockYY;

    if (this.by === 0) {
      boundary = this.getRow(this.conditions.n - 3);
      peerBlockYY = 1;
    } else {
      boundary = this.getRow(2);
      peerBlockYY = this.by - 1;
    }

    emitToNeighbour(peerBlockYY, this.bx, boundary);


  } else {

    var boundaryN = this.getRow(0);
    var boundaryS = this.getRow(this.conditions.n - 1);

    var peerBlockYYN = this.by - 1;
    var peerBlockYYS = this.by + 1;

    emitToNeighbour(peerBlockYYN, this.bx, boundary);
    emitToNeighbour(peerBlockYYS, this.bx, boundary);

  }

  if (this.isBoundaryBlockX()) {
    var boundary;
    var peerBlockXX;

    if (this.bx === 0) {
      boundary = this.getCol(this.conditions.m - 3);
      peerBlockXX = 1;
    } else {
      boundary = this.getCol(2);
      peerBlockXX = this.bx - 1;
    }

    emitToNeighbour(this.by, peerBlockXX, boundary);


  } else {

    var boundaryW = this.getCol(0);
    var boundaryE = this.getCol(this.conditions.m - 1);

    var peerBlockYYW = this.bx - 1;
    var peerBlockYYE = this.bx + 1;

    emitToNeighbour(peerBlockYYW, this.bx, boundaryW);
    emitToNeighbour(peerBlockYYE, this.bx, boundaryE);

  }

  function emitToNeighbour(by, bx, boundary ) {

    var data = {
      signal: 'b',
      boundary: boundary,
      bx: bx,
      by: by
    };

    var peerId = that.map[by][bx];
    var conn = !that.conditions[peerId] ? peer.connect(peerId) : that.conditions[peerId];

    conn.on('open', function () {
      console.log('sending boundary to', peerId, data.signal, data)
      conn.send(JSON.stringify(data));
    });

  }

}

Block.prototype.getRow = function (row) {

  var array = new Array(this.conditions.m);
  for (var i = 0; i < array.length; i++) {
    array[i] = this.poisson.u.new[row*this.conditions.m + i]
  }
  return array;

}

Block.prototype.getCol = function (col) {

  var array = new Array(this.conditions.n);
  for (var i = 0; i < array.length; i++) {
    array[i] = this.poisson.u.new[i*this.conditions.m + col]
  }
  return array;

}

Block.prototype.isBoundaryBlockY = function () {
  return this.by === 0 || this.by === this.map.length - 1;
}

Block.prototype.isBoundaryBlockX = function () {
  return this.bx === 0 || this.bx === this.map[0].length - 1;
}
