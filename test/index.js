var Poisson = require('./../lib/poisson');
var assert  = require('assert');
var conditions = {
  w: 1,
  h: 1,
  n: 10, //y # of nodes
  m: 10 //x # of nodes
}

var poisson = new Poisson(conditions);

var maxItterations = 100000;
var maxResidue = 1E-9 ;
poisson.solver( maxItterations, maxResidue);

poisson.analitical();

var res = 0;
for (var i = 0; i < this.n*this.m; i++) {
  res += Math.abs(this.u.new[i]-this.u.analitical[i]);
}

res += res/poisson.n/poisson.m;

assert(res < 1E-9, 'Numerical equals analitical.');
console.log('Test ok');


