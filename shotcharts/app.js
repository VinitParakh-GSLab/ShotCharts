
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var players = require('./routes/players');
var http = require('http');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

var myDb;
MongoClient.connect('mongodb://127.0.0.1:27017/nodetest3', function(err, db) {
	myDb = db;	
	http.createServer(app).listen(app.get('port'), function(){
  		console.log('Express server listening on port ' + app.get('port'));
  		app.get('/', routes.index);
		app.get('/getShots', players.getShots(myDb));
		app.get('/getPlayers', players.getPlayers(myDb));
		app.get('/charts', players.getPlayerShots(myDb));
		app.get('/playercharts', players.getPlayerShots2013(myDb));
		app.get('/newcharts', players.getShotDivision(myDb));
		app.get('/newplayercharts', players.getShotPlayerCharts(myDb));
	});
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


