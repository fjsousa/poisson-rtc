var Poisson = require('./lib/poisson');

var conditions = {
  w: 1,
  h: 1,
  n: 100, //y # of nodes
  m: 100 //x # of nodes
}

var poisson = new Poisson(conditions);

var maxItterations = 1000000;
var maxResidue = 1E-9 ;
poisson.solver( maxItterations, maxResidue);

poisson.analitical();

poisson.print('./field.txt', poisson.u.new);
poisson.print('./analitical.txt', poisson.u.analitical);




