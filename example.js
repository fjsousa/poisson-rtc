var Poisson = require('poisson-solver');

var conditions = {
  w: 1,
  h: 1,
  n: 50, 
  m: 50,
  bRow: 0,
  bCol: 0,
  bRows: 2,
  bCols: 2 
};

var poisson = new Poisson(conditions);

var N = [];
var S = [];
var E = [];
var W = [];

for (var i = 0; i < poisson.bm; i++) {
  N[i] = S[i] = 0;
}

for (var i = 0; i < poisson.bn; i++) {
  E[i] = W[i] = 0;
}

poisson.setBoundaryConditions(N, S, E, W);

var maxItterations = 10000000000;
var maxResidue = 1E-9 ;
poisson.solver( maxItterations, maxResidue);

poisson.print('./field.txt', poisson.u.new);

// poisson.analitical();
// poisson.print('./analitical.txt', poisson.u.analitical);








