importScripts('poisson.js');
var Poisson = require('poisson');

var poisson = null;
var conditions = null;
var map = null;
var by, bx;

self.addEventListener('message', function (msg) {

  if (msg.data.signal === 'field') {
    // console.log('[WORKER] Returning Field');
    return self.postMessage({ signal: 'field', u: poisson.u.new});
  }

  // console.log('[WORKER] Running...');

  //initialize poisson first time
  if (!poisson) {
    poisson = new Poisson(msg.data.conditions);
    conditions = msg.data.conditions;
    map = msg.data.map;
    by = msg.data.by;
    bx = msg.data.bx;
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
  if (isBoundaryBlockY(by)) {
    var peerBlockYY;

    if (by === 0) {
      boundary = getRow(conditions.n - 2);
      peerBlockYY = 1;
      name = 'N';
    } else {
      boundary = getRow(1);
      peerBlockYY = by - 1;
      name = 'S';
    }

    boundaries2Emit[name] = {peerBy: peerBlockYY, peerBx: bx, boundary: boundary};

  } else {

    var boundaryN = getRow(0);
    var boundaryS = getRow(conditions.n - 1);

    var peerBlockYYN = by - 1;
    var peerBlockYYS = by + 1;

    boundaries2Emit['S'] = {peerBy: peerBlockYYN, peerBx: bx, boundary: boundaryN};
    boundaries2Emit['N'] = {peerBy: peerBlockYYS, peerBx: bx, boundary: boundaryS};

  }

  if (isBoundaryBlockX(bx)) {
    var peerBlockXX;

    if (bx === 0) {
      boundary = getCol(conditions.m - 2);
      peerBlockXX = 1;
      name = 'W';
    } else {
      boundary = getCol(1);
      peerBlockXX = bx - 1;
      name = 'E';
    }

    boundaries2Emit[name] = {peerBy: by, peerBx: peerBlockXX, boundary: boundary};

  } else {

      var boundaryW = getCol(0);
      var boundaryE = getCol(conditions.m - 1);

      var peerBlockYYW = bx - 1;
      var peerBlockYYE = bx + 1;

      boundaries2Emit['E'] = {peerBy: by, peerBx: peerBlockYYW, boundary: boundaryW};
      boundaries2Emit['W'] = {peerBy: by, peerBx: peerBlockYYE, boundary: boundaryE};

  }

  self.postMessage({output: output, boundaries2Emit: boundaries2Emit});


}, false);

var isBoundaryBlockY = function (by) {
  return by === 0 || by === map.length - 1;
};

var isBoundaryBlockX = function (bx) {
  return bx === 0 || bx === map[0].length - 1;
};

var getRow = function (row) {

  var array = new Array(conditions.m);
  for (var i = 0; i < array.length; i++) {
    array[i] = poisson.u.new[row*conditions.m + i];
  }
  return array;
};

var getCol = function (col) {

  var array = new Array(conditions.n);
  for (var i = 0; i < array.length; i++) {
    array[i] = poisson.u.new[i*conditions.n + col];
  }
  return array;
};