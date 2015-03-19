#WebRTC Poisson solver

Client based, distributed CFD solver. 

There's a [blog post](//fjsousa.github.io/webrtc-part2.html) which covers the why and the how.

###Install

Clone the repository and type:

`npm install`

Update the poisson solver browser code with

`npm run browserify`

###Run

Launch server with 

`npm start`

Open tree tabs in 

`http://localhost:8080/experiment123`

Open the console in one of the tabs and write 

```Javascript
var opts = {
  peerList: peers,    //your peers
  blockRows: 2,       //number of block rows 
  blockCols: 2,       //number of block cols
  n: 50,              //number of rows of each block 
  m: 50,              //number of cols of each block
  blockMaxRes: 1E-9,  //inner solver stopping criteria 
  blockMaxItt: 60     //inner solver stopping criteria 
};

new AllPeers().update(function(peers){
  masterBlock = new MasterBlock(opts);
})
```

If something goes wrong just write

```
masterBlock.reload();
```

to reload all tabs and reconnect the peers.

When the process finishes, you'll get a download link for each block, in this case, 4:

![Solution](https://raw.githubusercontent.com/fjsousa/poisson-rtc/master/docs/solution.png "Solution")

###Open shift

This code is hosted on openshift and you can carry out the same experiment with

`
http://poissonwebrtc-fjsousa.rhcloud.com/experiement123
`

###Caveats

*Quick inner iterations: When the inner iteration cycle is very quick, 




