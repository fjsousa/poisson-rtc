var Poisson = require('../poisson');
var assert  = require('assert');

var conditions = {
  w: 1,
  h: 1,
  n: 5, //y # of nodes
  m: 5 //x # of nodes
}

var poisson = new Poisson(conditions);

var N = [0,0,0,0,0];
var S = [0,0,0,0,0];
var E = [0,0,0,0,0];
var W = [0,0,0,0,0];
poisson.setBoundaryConditions(N, S, E, W);

var maxItterations = 100000;
var maxResidue = 1E-9 ;
var error = poisson.solver( maxItterations, maxResidue);

if (!error) {
  poisson.analitical();

  var res = 0;
  for (var i = 0; i < this.n*this.m; i++) {
    res += Math.abs(this.u.new[i]-this.u.analitical[i]);
  }

  res += res/poisson.n/poisson.m;

  assert(res < 1E-9, 'Numerical equals analitical.');
} else {
  console.log(error);
}

//Test boundary conditions
N = [1,2,3,4,5];
S = [7,8,9,10,11];
E = [11,12,13,14,15];
W = [17,18,19,20,21];

var bcErr = poisson.setBoundaryConditions(N, S, E, W);

assert(bcErr === null, bcErr);
assert(poisson.u.old[1] === N[1], 'North Boundary set');
assert(poisson.u.old[(poisson.n-1)*poisson.n + 1 ] === S[1], 'South Boundary set');
assert(poisson.u.old[poisson.n] === W[1], 'West Boundary set');
assert(poisson.u.old[poisson.n*2-1 ] === E[1], 'West Boundary set');


// wrong bc array size
N = S = E = W = [0,0,0,0];
poisson.setBoundaryConditions(N, S, E, W);


console.log('Test ok');