var fs = require('fs');

var Poisson = function (opt) {

  this.h = opt.h;
  this.w = opt.w;
  this.n = opt.n; //y # of nodes
  this.m = opt.m; //x # of nodes
  this.d_x = opt.w / (opt.m -1);
  this.d_y = opt.h / (opt.n -1);

  this.AP = new Array(this.n*this.m);
  this.AE = new Array(this.n*this.m);
  this.AW = new Array(this.n*this.m);
  this.AN = new Array(this.n*this.m);
  this.AS = new Array(this.n*this.m);

  for (var i = 0; i < this.AP.length; i++ ) {
    this.AP[i] = -2/(this.d_x*this.d_x) -2/(this.d_y*this.d_y);
    this.AE[i] = 1/(this.d_x*this.d_x);
    this.AW[i] = 1/(this.d_x*this.d_x);
    this.AN[i] = 1/(this.d_y*this.d_y);
    this.AS[i] = 1/(this.d_y*this.d_y);
  }

  this.u = {
    'old': new Array(this.n*this.m),
    'new': new Array(this.n*this.m),
    empty: new Array(this.n*this.m)
  };

  this.initialize();
}

//Needs to return used iterations
//returns null if solver doesn't converge
Poisson.prototype.solver = function (maxItt, maxRes) {

  var itt = 0;
  var res = 1000000;
  while ( res > maxRes && itt < maxItt ) {


    for (var i = 1; i < this.n - 1; i++) { //y
      for (var j = 1; j < this.m - 1; j++) { //x

        var idx = i*(this.m) + j;

        var sum = this.AW[idx]*this.u.old[i * this.m + j - 1] +
         this.AE[idx]*this.u.old[i * this.m + j + 1] +
         this.AS[idx]*this.u.old[(i + 1) * this.m + j] +
         this.AN[idx]*this.u.old[(i - 1) * this.m + j];

        var x = this.d_x * j;
        var y = this.d_y * i;

        var pi = Math.PI;
        var b = -pi*pi*Math.sin(pi*y)*Math.cos(pi*(0.5-x)) -
          Math.sin(pi*y)*(pi*pi)*Math.cos(pi*(0.5-x));

        this.u.new[idx] = (-sum + b)/this.AP[idx];

      }
    }

    res = this.residue();
    if (itt%1000 === 0) {
      console.log(itt, res);
    }
    itt++;
    this.swap();

  }

  if ( res <= maxRes ) {
    return itt;
  } else {
    return null;
  }
}

Poisson.prototype.setBoundaryConditions = function(N, S, E, W) {

  if ( N.length !== this.n || S.length !== this.n || E.length !== this.m || W.length !== this.m ) {
    return 'Boundary conditions size don\'t match';
  }

  for (var col = 0; col < N.length; col ++) {
    this.u.new[col] = this.u.old[col] = N[col];
    this.u.new[(this.n -1) * this.m + col] = this.u.old[(this.n -1) * this.m + col] = S[col];
  }

  for (var row = 0; row < E.length; row ++ ){
    this.u.new[row*this.n] = this.u.old[row*this.n] = W[row];
    this.u.new[row*this.n + this.n - 1] = this.u.old[row*this.n + this.n - 1] = E[row];

  }

  return null;

}

Poisson.prototype.residue = function () {

  res = 0;
  for (var i = 0; i < this.n*this.m; i++) {
    res += Math.abs(this.u.new[i]-this.u.old[i]);
  }
  return res/this.m/this.n;

}

Poisson.prototype.print = function (filename, dataSet) {

  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
}
  for (var i = 0; i < this.n; i++) { //y
    for (var j = 0; j < this.m; j++) { //x
      fs.appendFileSync(filename, '' + dataSet[i*this.m + j] + ' ');
    }
    fs.appendFileSync(filename, '\n');
  }
}

Poisson.prototype.swap = function () {

  var temp = this.u.old;
  this.u.old = this.u.new;
  this.u.new = temp;

}

Poisson.prototype.initialize = function () {

  for (var i = 0; i < this.n*this.m; i++) {
    this.u.old[i] = 0;
  }

}

Poisson.prototype.analitical = function () {

  this.u.analitical = new Array(this.m*this.n);
  for (var i = 0; i < this.n; i++) { //y
    for (var j = 0; j < this.m; j++) { //x

      var x = this.d_x * j;
      var y = this.d_y * i;

      this.u.analitical[i*this.m + j] = [Math.cos(Math.PI*(0.5-x)/this.w) * Math.sin(Math.PI*y/this.h)];

    }
  }
}
module.exports = Poisson;