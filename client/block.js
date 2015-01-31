var ws = new WebSocket("ws:localhost:9001");
var Poisson = require('poisson');

var Block = function (opts) {
  this.outerIteration = 0;
  this.bc = opts.bc;
  this.conditions = { w: opts.w, h: opts.h, n: opts.n, m: opts.m }
  this.peerId = null;
  this.masterId = opts.masterId;
  this.map = opts.map;
  this.blockRows = null;
  this.blockCols = null;
  this.by = opts.blocks[0];
  this.bx = opts.blocks[1];
  this.maxItt = 100;
  this.maxRes = 1E-9;
  this.poisson = null;
  this.connections = {};
  this.boundaryCount = null;
  this.continueSignal = false;

  this.resetCounters();
  this.switchSignal();
};

Block.prototype.emitFields = function (){

  var msg = {
    signal: 'block-field',
    conditions: this.conditions,
    blocks: [this.by,this.bx],
    field: this.poisson.u.new
  };

  ws.send(JSON.stringify(msg));
}

Block.prototype.runPoisson = function (){

  //initialize poisson first time
  if (!this.poisson) {
    this.poisson = new Poisson(this.conditions);
  }

  if (this.boundariesReady() && this.signalReady()) {
    console.log('[BLOCK] Running solver at outer iteration', ++this.outerIteration);

    var bc = this.bc;

    var err = this.poisson.setBoundaryConditions(bc.N, bc.S, bc.E, bc.W);

    if (err) {
      console.error('[ERROR] Boundaries not set:', err);
      return;
    }

    var output = this.poisson.solver(this.maxItt, this.maxRes);

    console.log('[BLOCK] Poisson converged with', output.iterations, 'iterations and', output.residue, 'residue');

    this.switchSignal();
    this.emit();
    this.notifyMaster(output.iterations);
  }

}

Block.prototype.notifyMaster = function (itt) {

  var data = {
    signal: 'p',//progress
    itt: itt
  }

  var conn = peer.connect(this.masterId);
  conn.on('open', function () {
    conn.send(JSON.stringify(data))
  })

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

    console.log('[BLOCK EMIT] Sending boundary to', peerId, by, bx);

    var conn;
    if (!that.connections[peerId]) {
      conn = peer.connect(peerId);
      that.connections[peerId] = conn;
      conn.send(JSON.stringify(data));
    } else {

      //check if connection is active
      conn = that.connections[peerId];
      conn.send(JSON.stringify(data));
    }

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

Block.prototype.boundariesReady =  function () {
  return !!this.boundaryCount;
}

Block.prototype.signalReady =  function () {
  return this.continueSignal;
}

Block.prototype.switchSignal = function () {
  this.continueSignal = !this.continueSignal;
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

  if (!!--this.boundaryCount) {
    this.resetCounters();
  }

}