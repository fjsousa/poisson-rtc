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
  this.by = opts.blocks[0];
  this.bx = opts.blocks[1];
  this.itt = null;
  this.maxItt = opts.maxItt;
  this.maxRes = opts.maxRes;
  this.connections = {};
  this.boundaryCount = null;
  this.masterConn = null;
  this.worker = new Worker('worker.js');
  this.solverReturned = false;

  var that = this;

  this.worker.addEventListener('message', function (msg) {
    if(msg.data.err){
      console.error('[WORKER] error in worker.');
      return;
    }

    // console.log('[BLOCK DEBUG]after worker post', Date.now());

    //emit field at the last iteration
    if (msg.data.signal === 'field') {

      emitField(msg.data.uMatrix);

    //emit boundaries and notify master block at each iteration
    } else {
      var output = msg.data.output;

      // console.log('[BLOCK DEBUG] Poisson converged with', output.iterations, 'iterations and', output.residue, 'residue');
      that.itt = output.iterations;
      that.res = output.residue;
      that.solverReturned = true;
      that.notifyMaster();

      for (var name in msg.data.boundaries2Emit) {
        var boundaryData = msg.data.boundaries2Emit[name];

        try {
          emitToNeighbour(boundaryData.peerBy, boundaryData.peerBx, name, boundaryData.boundary);
        }
        catch (e) {
          console.error(e);
        }
        
      }
    }

  });

  function emitField(uMatrix){
    //u is a 2d array

    var data = {
      signal: 'f',
      uMatrix: uMatrix,
      by: that.by,
      bx: that.bx
    };

    that.masterConn.send(JSON.stringify(data));
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

    // console.log('[BLOCK DEBUG] Sending boundary to', peerId, by, bx);

    var conn;
    if (!that.connections[peerId]) {
      conn = peer.connect(peerId);
      conn.on('open', function (){
        that.connections[peerId] = conn;
        // console.log('[BLOCK DEBUG] emit sending to', peerId, Date.now());
        conn.send(JSON.stringify(data));        
      });

      conn.on('close', function () {
        throw 'Connection to peer closed.';
      });

      conn.on('error', function (err) {
        throw 'Error on peer connection ' + err;
      });

    } else {

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
  // console.log('[BLOCK DEBUG] Running solver at outer iteration', this.outerIteration, Date.now());

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

      this.masterConn.on('close', function () {
        throw 'Connection to Master peer closed.';
      });

      this.masterConn.on('error', function (err) {
        throw 'Error on Master peer connection ' + err;
      });

      return;
    } 
    // console.log('[BLOCK DEBUG] Proceed message');
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

  if(this.isBoundaryBlockY() && this.conditions.bCols === 1 )
    this.boundaryCount = 1;

  if(this.isBoundaryBlockX() && this.conditions.bRows === 1 )
    this.boundaryCount = 1;
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

  try {
    this.notifyMaster();
  }
  catch (e) {
    console.error(e);
  }
  
};