var Poisson = require('./lib/poisson');

// var conditions = {
//   w: 1,
//   h: 1,
//   n: 100, //y # of nodes
//   m: 100 //x # of nodes
// }

var conditions = {
  w: 1,
  h: 1,
  n: 5, 
  m: 5,
  bRow: 0,
  bCol: 2,
  bRows: 3,
  bCols: 3 
};

var N = [];
var S = [];
var E = [];
var W = [];

// for (var i = 0; i < conditions.n; i++) {
//   N[i] = S[i] = E[i] = W[i] = 0;
// }
var poisson = new Poisson(conditions);

console.log(poisson)
// poisson.setBoundaryConditions(N, S, E, W);

// var maxItterations = 100000000;
// var maxResidue = 1E-9 ;
// poisson.solver( maxItterations, maxResidue);

poisson.analitical();

// poisson.print('./field.txt', poisson.u.old);
poisson.print('./analitical.txt', poisson.u.analitical);








