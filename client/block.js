var ws = new WebSocket("ws:localhost:9001");

//stop criteria
var ITTSTOP = 1000;

//core resolution, number of rows and cols
var n = 10;
var m = 10;

var Poisson = require('poisson');
var poisson = null;


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
};

Block.prototype.runPoisson = function(){

  if (!poisson) {
    var bc = this.bc;
    poisson = new Poisson(this.conditions);
    poisson.setBoundaryConditions(bc.N, bc.S, bc.E, bc.W);
    var itt = poisson.solver(block.maxItt, block.maxRes);

      // var msg = {
      //   signal: 'block-field',
      //   conditions: { w: data.w, h: data.h, n: data.n, m: data.m },
      //   blocks: data.blocks,
      //   field: poisson.u.new
      // };
      // ws.send(JSON.stringify(msg));



    // block.notifyMaster(itt, this.peerId);



    //notify master on progress
    //master keeps track of progress
    //and stops process if convergence criteria is met

    // block.Emit();


  }

}