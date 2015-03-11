#WebRTC Poisson solver

###Install

Clone the repository and type:

`npm install`

Update the poisson solver browser code with

`npm run browserify`

###Run

Launch server with 

`npm start`

Open tree tabs in 

`http://localhost:8080/:experiment123`

Open the console in one of the tabs and write 

```Javascript
var opts = {
  peerList: peers,    //your peers
  blockRows: 2,       //number of rows blocks
  blockCols: 2,       //number of cols blocks
  n: 50,              //number of rows of each block 
  m: 50,              //number of cols of each block
  blockMaxRes: 1E-9,  //inner solver stopping criteria 
  blockMaxItt: 60     //inner solver stopping criteria 
};

new AllPeers().update(function(peers){
  masterBlock = new MasterBlock(opts);
})
```




