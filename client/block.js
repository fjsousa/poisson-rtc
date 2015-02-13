var ws = new WebSocket("ws:localhost:9001");

var Block = function (opts) {
  this.outerIteration = 0;
  this.bc = opts.bc;
  this.conditions = { 
    w: opts.w, 
    h: opts.h, 
    n: opts.n, 
    m: opts.m,
    bRow: opts.bRow,
    bCol: opts.bCol,
    bRows: opts.bRows,
    bCols: opts.bCols
  };
  this.peerId = null;
  this.masterId = opts.masterId;
  this.map = opts.map;
  this.blockRows = null;
  this.blockCols = null;
  this.by = opts.blocks[0];
  this.bx = opts.blocks[1];
  this.itt = null;
  this.maxItt = 1;
  this.maxRes = 1E-9;
  this.connections = {};
  this.boundaryCount = null;
  this.masterConn = null;
  this.worker = new Worker('worker.js');
  this.solverReturned = false;

  var that = this;

  this.worker.addEventListener('message', function (msg) {
    if(msg.data.err){
      // console.log('[BLOCK] error in worker.');
      return;
    }

    //emit field at the last iteration
    if (msg.data.signal === 'field') {

      emitField(msg.data.u);

    //emit boundaries and notify master block at each iteration
    } else {
      var output = msg.data.output;

      // console.log('[BLOCK] Poisson converged with', output.iterations, 'iterations and', output.residue, 'residue');
      that.itt = output.iterations;
      that.res = output.residue;
      that.solverReturned = true;
      that.notifyMaster();

      for (var name in msg.data.boundaries2Emit) {
        var boundaryData = msg.data.boundaries2Emit[name];
        emitToNeighbour(boundaryData.peerBy, boundaryData.peerBx, name, boundaryData.boundary);
      }
    }


  });

  function emitField(u){

    var msg = {
      signal: 'block-field',
      conditions: that.conditions,
      blocks: [that.by,that.bx],
      field: u
    };

    ws.send(JSON.stringify(msg));
  }

  function emitToNeighbour(by, bx, name, boundary ) {

    var data = {
      signal: 'b',
      boundary: boundary,
      bx: bx,
      by: by,
      name: name
    };

    var peerId = that.map[by][bx];

    // console.log('[BLOCK EMIT] Sending boundary to', peerId, by, bx);

    var conn;
    if (!that.connections[peerId]) {
      conn = peer.connect(peerId);
      conn.on('open', function (){
        that.connections[peerId] = conn;
        conn.send(JSON.stringify(data));        
      });

    } else {

      //check if connection is active
      conn = that.connections[peerId];
      // console.log('[BLOCK DEBUG] connection:', conn.open, conn, data, peerId);
      conn.send(JSON.stringify(data));
    }
  }
};

Block.prototype.emitFields = function (){

  this.worker.postMessage({signal: 'field'});

};

Block.prototype.runPoisson = function (){
  this.resetCounters();
  ++this.outerIteration;
  // console.log('[BLOCK] Running solver at outer iteration', this.outerIteration);

  // this.calcInnerItt();

  var workerOpts = {
    by: this.by,
    bx: this.bx,
    conditions: this.conditions,
    bc: this.bc,
    maxItt: this.maxItt,
    maxRes: this.maxRes,
    map: this.map
  };

  //Run worker
  //boundaries are emited on returning post message
  this.worker.postMessage(workerOpts);
};

Block.prototype.notifyMaster = function (itt) {

  if (this.boundariesReady() && this.solverDone()) {

    var data = {
      signal: 'p',//progress
      itt: this.itt,
      res: this.res,
      outer: this.outerIteration
    };

    var that = this;

    if (!this.masterConn) {
      this.masterConn = peer.connect(this.masterId);
      this.masterConn.on('open', function () {
        that.masterConn.send(JSON.stringify(data));
      });

      return;
    } 
    // console.log('[BLOCK] Proceed message');
    return this.masterConn.send(JSON.stringify(data));

  }



};

Block.prototype.isBoundaryBlockY = function () {
  return this.by === 0 || this.by === this.map.length - 1;
};

Block.prototype.isBoundaryBlockX = function () {
  return this.bx === 0 || this.bx === this.map[0].length - 1;
};

Block.prototype.resetCounters = function () {

  this.solverReturned = false;

  if (this.isBoundaryBlockY() && this.isBoundaryBlockX()) {
    this.boundaryCount = 2;
  } else {
    this.boundaryCount = 4;
  }
};

Block.prototype.boundariesReady =  function () {
  return !this.boundaryCount;
};

Block.prototype.solverDone =  function () {
  return this.solverReturned;
};

Block.prototype.calcInnerItt = function () {
  if (this.outerIteration < 10 ) {
      this.maxItt = 100;
  } else if (this.outerIteration < 100) {
    this.maxItt = 100;
  } else {
    this.maxItt = 100;
  }
};

Block.prototype.updateBoundaries = function (data) {

  switch (data.name) {
    case 'E':
      this.bc.E = data.boundary;
      break;
    case 'W':
      this.bc.W = data.boundary;
      break;
    case 'N':
      this.bc.N = data.boundary;
      break;
    case 'S':
      this.bc.S = data.boundary;
      break;
  }

  
  if (--this.boundaryCount < 0 ) {
    this.boundaryCount = 0;
  }

  this.notifyMaster();
};