var test_a = JSON.parse("[0.348150003221834,0,0,0,0,0,0,0,0,0,0,0.43753068058604005,0.33507841454052334,0.33125556352235236,0.3505230084518855,0.36396087312585756,0.35853887420677494,0.32868383776128085,0.27364335699516457,0.19634349944751642,0.10254954411204355,0,0.5339083418447921,0.5526781480220891,0.6035673964918677,0.657527578025584,0.6887695340402433,0.6805132797356883,0.6245410440386572,0.520198071638113,0.37332766207772466,0.1950054109690462,0,0.614392976676316,0.7023050046060407,0.8046110112320857,0.8933848627086801,0.9427308799358219,0.9341795150480249,0.8584234616815254,0.715414713031246,0.5135663810908635,0.26829100308128373,0,0.6612104036739321,0.7881898633599238,0.9253212707120945,1.0394751902715964,1.1027120217321533,1.0953568943672947,1.0076809883939872,0.8402761463448498,0.60336663576354,0.315244201131477,0,0.6624734627194796,0.8059106986431013,0.9586634926467512,1.0846050197192716,1.1547423118505193,1.1491240314756939,1.0581246406788987,0.8827646619764392,0.6340342891489492,0.3313070898765574,0,0.6126306149285861,0.7533184696419779,0.9027928299034842,1.0258455396364505,1.0947971536556396,1.0908802024710706,1.0051978600501548,0.8389300272612907,0.6026746173702061,0.31495236302153096,0,0.5124780483229116,0.6339276592882132,0.7629982923507364,0.8693095690532203,0.929177750161137,0.9266707438834753,0.854313759285978,0.7132053834341765,0.5124362647110325,0.26781566903483334,0,0.36868209394025503,0.45756780770347905,0.5520976007483674,0.6300219026949256,0.674055947838026,0.6726177191439469,0.6203034635619195,0.5179466911087721,0.3721838785952549,0.1945260292730219,0,0.19281958011372932,0.23971044223194726,0.2896051150789692,0.3307589827304292,0.3540608940140738,0.35341656968331325,0.3259901593709593,0.27222852843407824,0.1956292441228331,0.10225113485686668,0,0,0,0,0,0,0,0,0,0,0,0]")

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
  n: 200, //y # of nodes
  m: 200 //x # of nodes
}

var N = [];
var S = [];
var E = [];
var W = [];

for (var i = 0; i < conditions.n; i++) {
  N[i] = S[i] = E[i] = W[i] = 0;
}
var poisson = new Poisson(conditions);
poisson.setBoundaryConditions(N, S, E, W);

var maxItterations = 1000000;
var maxResidue = 1E-9 ;
poisson.solver( maxItterations, maxResidue);

poisson.analitical();

poisson.print('./field.txt', poisson.u.new);
poisson.print('./analitical.txt', poisson.u.analitical);

poisson.print('test', test_a)








