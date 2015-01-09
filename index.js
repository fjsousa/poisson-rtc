var Poisson = require('./lib/poisson');

var conditions = {
  w: 1,
  h: 1,
  n: 300, //y # of nodes
  m: 300 //x # of nodes
}

var poisson = new Poisson(conditions);

var maxItterations = 100000;
var maxResidue = 1E-5 ;
poisson.solver( maxItterations, maxResidue);

poisson.print('./field.txt');




