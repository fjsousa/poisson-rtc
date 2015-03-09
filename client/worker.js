importScripts('poisson.js');
var Poisson = require('poisson');

var poisson = null;
var conditions = null;
var map = null;
var by, bx;

self.addEventListener('message', function (msg) {

  if (msg.data.signal === 'field') {
    // console.log('[WORKER] Returning Field');

    var uMatrix = new Array(poisson.bn);
    for (var i = 0; i < poisson.bn; i++) { //y
      
      uMatrix[i]  = new Array(poisson.bm);
      
      for (var j = 0; j < poisson.bm; j++) { //x
        uMatrix[i][j] =  poisson.u.new[i*poisson.bm + j];
      }
    }

    return self.postMessage({ signal: 'field', uMatrix: uMatrix});
  }

  // console.log('[WORKER] Running...');

  //initialize poisson first time
  if (!poisson) {
    console.log('[WORKER] initialize poisson ...');
    poisson = new Poisson(msg.data.conditions);
    conditions = msg.data.conditions;
    map = msg.data.map;
  }

  var bc = msg.data.bc;
  var err = poisson.setBoundaryConditions(bc.N, bc.S, bc.E, bc.W);

  if (err) {
    console.error('[ERROR WORKER] Boundaries not set:', err);

    self.postMessage({err: err});
    return;
  }

  var output = poisson.solver(msg.data.maxItt, msg.data.maxRes);

  var boundaries2Emit = {};
  var boundary;
  if (isBoundaryBlockY(poisson.bRow)) {
    var peerBlockYY;

    if (poisson.bRow === 0) {
      boundary = getRow(poisson.bn - 2);
      peerBlockYY = 1;
      name = 'N';
    } else {
      boundary = getRow(1);
      peerBlockYY = poisson.bRow - 1;
      name = 'S';
    }

    boundaries2Emit[name] = {peerBy: peerBlockYY, peerBx: poisson.bCol, boundary: boundary};

  } //else {

  //   var boundaryN = getRow(0);
  //   var boundaryS = getRow(conditions.n - 1);

  //   var peerBlockYYN = poisson.bRow - 1;
  //   var peerBlockYYS = poisson.bRow + 1;

  //   boundaries2Emit['S'] = {peerBy: peerBlockYYN, peerBx: poisson.bCol, boundary: boundaryN};
  //   boundaries2Emit['N'] = {peerBy: peerBlockYYS, peerBx: poisson.bCol, boundary: boundaryS};

  // }

  if (isBoundaryBlockX(poisson.bCol)) {
    var peerBlockXX;

    if (poisson.bCol === 0) {
      boundary = getCol(poisson.bm - 2);
      peerBlockXX = 1;
      name = 'W';
    } else {
      boundary = getCol(1);
      peerBlockXX = poisson.bCol - 1;
      name = 'E';
    }

    boundaries2Emit[name] = {peerBy: poisson.bRow, peerBx: peerBlockXX, boundary: boundary};

  } //else {

  //     var boundaryW = getCol(0);
  //     var boundaryE = getCol(conditions.m - 1);

  //     var peerBlockYYW = poisson.bCol - 1;
  //     var peerBlockYYE = poisson.bCol + 1;

  //     boundaries2Emit['E'] = {peerBy: poisson.bRow, peerBx: peerBlockYYW, boundary: boundaryW};
  //     boundaries2Emit['W'] = {peerBy: poisson.bRow, peerBx: peerBlockYYE, boundary: boundaryE};

  // }

  self.postMessage({output: output, boundaries2Emit: boundaries2Emit});


}, false);

var isBoundaryBlockY = function (by) {
  return by === 0 || by === map.length - 1;
};

var isBoundaryBlockX = function (bx) {
  return bx === 0 || bx === map[0].length - 1;
};

var getRow = function (row) {

  var array = new Array(poisson.bm);
  for (var i = 0; i < array.length; i++) {
    array[i] = poisson.u.new[row*poisson.bm + i];
  }
  return array;
};

var getCol = function (col) {

  var array = new Array(poisson.bn);
  for (var i = 0; i < array.length; i++) {
    array[i] = poisson.u.new[i*poisson.bm + col];
  }
  return array;
};