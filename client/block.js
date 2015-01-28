//stop criteria
var ITTSTOP = 1000;

//core resolution, number of rows and cols
var n = 10;
var m = 10;

var Poisson = require('poisson');
var poisson = null;

var Block = function () {
  this.peerId = null;
  this.map = null;
  this.blockRows = null;
  this.blockCols = null;
  this.by = null;
  this.bx = null;
  this.converged = false;
  this.maxItt = 1000000;
  this.maxRes = 1E-9;
};

Block.prototype.runPoisson = function(data){

  if (!poisson) {
    this.by = data.blocks[0];
    this.bx = data.blocks[1];

    var bc = data.bc;
    poisson = new Poisson({ w: data.w, h: data.h, n: data.n, m: data.m });
    poisson.setBoundaryConditions(bc.N, bc.S, bc.E, bc.W);
    var itt = poisson.solver(block.maxItt, block.maxRes);

    block.notifyMaster(itt, this.peerId);



    //notify master on progress
    //master keeps track of progress
    //and stops process if convergence criteria is met

    block.Emit();


  }

}