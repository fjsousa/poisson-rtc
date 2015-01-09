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
    'old': Array.apply(null, new Array(this.n*this.m)).map(Number.prototype.valueOf,0),
    'new': Array.apply(null, new Array(this.n*this.m)).map(Number.prototype.valueOf,0),
    empty: Array.apply(null, new Array(this.n*this.m)).map(Number.prototype.valueOf,0)
  };
}

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
        var y = this.d_x * i;

        var pi = Math.PI;
        var b = -pi*pi*Math.sin(pi*y)*Math.cos(pi*(0.5-x)) -
          Math.sin(pi*y)*(pi*pi)*Math.cos(pi*(0.5-x));

        this.u.new[idx] = (-sum + b)/this.AP[idx];

      }
    }

    res = this.residue();
    if (itt%100 === 0)
      console.log(itt, res);
    itt++;
    this.swap();

  }

}

Poisson.prototype.residue = function () {

  res = 0;
  for (var i = 0; i < this.n*this.m; i++) {
    res += Math.abs(this.u.new[i]-this.u.old[i]);
  }
  return res/this.m/this.n;

}

Poisson.prototype.print = function (filename) {

  fs.unlinkSync(filename);
  for (var i = 0; i < this.n; i++) { //y
    for (var j = 0; j < this.m; j++) { //x
      fs.appendFileSync(filename, '' + this.u.old[i*this.m + j] + ' ');
    }
    fs.appendFileSync(filename, '\n');
  }
}

Poisson.prototype.swap = function () {

  var temp = this.u.old;
  this.u.old = this.u.new;
  this.u.new = temp;

}
module.exports = Poisson;