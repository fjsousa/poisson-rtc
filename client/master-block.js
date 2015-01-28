//stop criteria
var ITTSTOP = 1000;

//core resolution, number of rows and cols
var n = 10;
var m = 10;

//block convergence
var maxItterations = 1000000;
var maxResidue = 1E-9 ;

var Poisson = require('poisson');
var poisson = null;

var MasterBlock = function (opts) {
  this.map = null;
  this.peerItt = {};
  this.connections = {};
  this.peerList = opts.peerList;
  this.blockRows = opts.blockRows;
  this.blockCols = opts.blockCols;

  that = this;
  opts.peerList.forEach(function(peerId){
    that.peerItt[peerId] = { old: 1000000000};
    that.connections[peerId] = peer.connect(peerId);
  });

  this.initMap();

};

MasterBlock.prototype.judgeConvergence = function (itt, peerId){

  //Stop when first block converges
  if ( Math.abs(this.peerItt[peerId] - itt) < ITTSTOP ) {

    //for all peers

    //Stop all peers
    this.connections.forEach(function(conn) {
      conn.on('open', function(){
        var data = { signal: 's' };
        conn.send(JSON.stringify(data));
      });

    });


  } else {
    this.peerItt[peerId] = itt;
  }

}

MasterBlock.prototype.launch = function (){

  for (var by = 0; by < this.map.length; by++) {
    for (var bx = 0; bx < this.map[0].length; bx++) {

      var pId = this.map[by][bx];
      var conn = this.connections[pId];

      console.log(pId, by, bx)

      var that = this;

      (function (blocks, connection) {
        connection.on('open', function(){

          var data = { signal: 'i' };

          data.blocks = blocks;
          data.map = that.map;

          if (that.isBoundaryBlockY(by)){
            data.h = 1/that.map.length * (1 + 1/n);
            data.n = n + 1;
            data.bc = {
              E: that.buildBoundary(0, n + 1),
              W: that.buildBoundary(0, n + 1)
            };
          } else {
            data.h = 1/that.map.length * (1 + 2/n);
            data.n = n + 2;
            data.bc = {
              E: that.buildBoundary(0, n + 2),
              W: that.buildBoundary(0, n + 2)
            };
          }
          //Is this a boundary block in x?
          if (that.isBoundaryBlockX(bx)){
            data.w = 1/that.map[0].length * (1 + 1/m);
            data.m = m + 1;

            data.bc.N = that.buildBoundary(0, n + 1);
            data.bc.S = that.buildBoundary(0, n + 1);

          } else {
            data.w = 1/that.map[0].length * (1 + 2/m);
            data.m = m + 2;

            data.bc.N = that.buildBoundary(0, n + 2);
            data.bc.S = that.buildBoundary(0, n + 2);
          }

          connection.send(JSON.stringify(data));
          console.log('Peer poisson init');
        });
      })([by,bx], conn);
    }
  }
}

MasterBlock.prototype.isBoundaryBlockY = function (by) {
  return by === 0 || by === this.map.length - 1;
}

MasterBlock.prototype.isBoundaryBlockX = function (bx) {
  return bx === 0 || bx === this.map[0].length - 1;
}

MasterBlock.prototype.buildBoundary = function (value, size){
  var array = new Array(size);
  for (var i = 0; i < array.length; i++) {
    array[i] = value;
  }
  return array;
}

MasterBlock.prototype.initMap = function () {

  var map = new Array(this.blockRows);
  for (var row = 0; row < this.blockRows; row ++) {
      map[row] = new Array(this.blockCols);
  }

  var i = 1;
  for (row = 0; row < this.blockRows; row++) {
    for (col = 0; col < this.blockCols; col++) {
      map[row][col] = this.peerList[i++];
    }
  }

  this.map = map;
}