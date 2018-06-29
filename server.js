var http = require('http');
var path = require('path');
var express = require("express");
var app = express();
var cors = require('cors'); // toelaten voor cross domain 
var port = process.env.PORT || 8000; // website + API zal openstaan op poort 80
var expressStaticGzip = require("express-static-gzip");

app.use(function(req, res, next) {
    req.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methodes", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
var originsWhitelist = [
    'http://localhost:8000',
    'http://localhost:1337'
];
   
var corsOptions = {
    origin: function(origin, callback){
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
    },
    credentials:true
}
app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname,'dist')),expressStaticGzip("dist", { indexFromEmptyFile: false })); // the map of the site

app.get('*', function(req, res, next) {
	res.sendFile(path.join(__dirname + '/dist/index.html.gz'));
});

var server = http.createServer(app).listen(port,function(){
	console.log("serving https op poort "+port);
});
