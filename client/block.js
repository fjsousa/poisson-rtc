var ws = new WebSocket("ws:localhost:9001");
var Poisson = require('poisson');

var Block = function (opts) {
  this.outerIteration = 0;
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

  this.resetCounters();
};

Block.prototype.runPoisson = function(){

  console.log('Running solver at outer iteration', this.outerIteration);

  //initialize poisson first time
  if (!this.poisson) {
    this.poisson = new Poisson(this.conditions);
  }

  var bc = this.bc;
  this.poisson.setBoundaryConditions(bc.N, bc.S, bc.E, bc.W);
  var itt = this.poisson.solver(this.maxItt, this.maxRes);

  console.log('Poisson converged with', itt, 'iterations.');
  this.resetCounters();

  if (++this.outerIteration === 100) {
    console.log('Sending field data to server');
    var msg = {
      signal: 'block-field',
      conditions: this.conditions,
      blocks: [this.by,this.bx],
      field: this.poisson.u.new
    };
    return ws.send(JSON.stringify(msg));
  }


  this.emit();

  // block.notifyMaster(itt, this.peerId);

}

Block.prototype.emit = function () {

  var that = this;
  var name;

  if (this.isBoundaryBlockY()) {
    var boundary;
    var peerBlockYY;

    if (this.by === 0) {
      boundary = this.getRow(this.conditions.n - 3);
      peerBlockYY = 1;
      name = 'N';
    } else {
      boundary = this.getRow(2);
      peerBlockYY = this.by - 1;
      name = 'S';
    }

    emitToNeighbour(peerBlockYY, this.bx, name, boundary);


  } else {

    var boundaryN = this.getRow(0);
    var boundaryS = this.getRow(this.conditions.n - 1);

    var peerBlockYYN = this.by - 1;
    var peerBlockYYS = this.by + 1;

    emitToNeighbour(peerBlockYYN, this.bx, 'S', boundary);
    emitToNeighbour(peerBlockYYS, this.bx, 'N', boundary);

  }

  if (this.isBoundaryBlockX()) {
    var boundary;
    var peerBlockXX;

    if (this.bx === 0) {
      boundary = this.getCol(this.conditions.m - 3);
      peerBlockXX = 1;
      name = 'W';
    } else {
      boundary = this.getCol(2);
      peerBlockXX = this.bx - 1;
      name = 'E';
    }

    emitToNeighbour(this.by, peerBlockXX, name, boundary);


  } else {

    var boundaryW = this.getCol(0);
    var boundaryE = this.getCol(this.conditions.m - 1);

    var peerBlockYYW = this.bx - 1;
    var peerBlockYYE = this.bx + 1;

    emitToNeighbour(peerBlockYYW, this.bx, 'E', boundaryW);
    emitToNeighbour(peerBlockYYE, this.bx, 'W', boundaryE);

  }

  //var name is the name of the boundary, relative to the neighbour (important)
  function emitToNeighbour(by, bx, name, boundary ) {

    var data = {
      signal: 'b',
      boundary: boundary,
      bx: bx,
      by: by,
      name: name
    };

    var peerId = that.map[by][bx];
    var conn = !that.conditions[peerId] ? peer.connect(peerId) : that.conditions[peerId];

    conn.on('open', function () {
      console.log('Sending boundary to', peerId);
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
    array[i] = this.poisson.u.new[i*this.conditions.n + col];
  }
  return array;

}

Block.prototype.isBoundaryBlockY = function () {
  return this.by === 0 || this.by === this.map.length - 1;
}

Block.prototype.isBoundaryBlockX = function () {
  return this.bx === 0 || this.bx === this.map[0].length - 1;
}

Block.prototype.resetCounters = function () {

  if (this.isBoundaryBlockY() && this.isBoundaryBlockX()) {
    this.boundaryCount = 2;
  } else {
    this.boundaryCount = 4;
  }
}

Block.prototype.boundariesAreReady =  function () {
  return !--this.boundaryCount;
}

Block.prototype.updateBoundaries = function (data) {

  if (data.name === 'E') {
    this.bc.E = data.boundary;
  } else if (data.name === 'W' ) {
    this.bc.W = data.boundary;
  } else if (data.name === 'N' ) {
    this.bc.N = data.boundary;
  } else if (data.name === 'S' ) {
    this.bc.S = data.boundary;
  }

}