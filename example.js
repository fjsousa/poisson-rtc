var Poisson = require('./lib/poisson');

var conditions = {
  w: 1,
  h: 1,
  n: 500, 
  m: 500
};

var poisson = new Poisson(conditions);

var N = [];
var S = [];
var E = [];
var W = [];

for (var i = 0; i < conditions.n; i++) {
  N[i] = S[i] = E[i] = W[i] = 0;
}

poisson.setBoundaryConditions(N, S, E, W);

var maxItterations = 100000000;
var maxResidue = 1E-9 ;
poisson.solver( maxItterations, maxResidue);

poisson.print('./field.txt', poisson.u.old);

// poisson.analitical();
// // poisson.print('./analitical.txt', poisson.u.analitical);








