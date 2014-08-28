exports.getPlayers = function(db){

    return function(req, res) { 
            
            var collection = db.collection('playerShot');
            
            var query = {
                player: {
                    $regex: new RegExp("^" + req.query.player + ".*"),
                    $options: 'i' , //i: ignore case, m: multiline, etc,
                },
                
            };

            var obj = {};
            obj['player'] = 1;

            collection.find(query, obj).toArray(function(err, docs) {
                    res.setHeader('Content-Type', 'application/json');
                    if(err)
                    {
                        console.log(err);
                        res.end(JSON.stringify({ "players" : ''}));    
                    }
                    else
                    {
                        if(typeof docs[0] == "undefined")
                            res.end(JSON.stringify({ "players" : ''}));    
                        else
                        {
                            var players = [];
                            for(var i=0; i<docs.length;i++)
                                players.push(docs[i].player)
                        }
                            res.end(JSON.stringify({ "players" : players }));
                    }               
            });
    };
}

exports.getShots = function(db) {
    return function(req, res) {

            var collection = db.collection('playerShot');
            var year  = req.query.year;
            console.log(year);

            var query = {
                player: {
                    $regex: req.query.player,
                    $options: 'i' , //i: ignore case, m: multiline, etc,
                },
                
            };

            var obj = {};
            obj[year] = 1;

            collection.find(query, obj).toArray(function(err, docs) {
                    res.setHeader('Content-Type', 'application/json');

                    if(err)
                    {
                        console.log(err);
                        res.end(JSON.stringify({ "error" : 'Player not found'}));    
                    }
                    else
                    {
                        //console.log(docs[0]);
                        if(typeof docs[0][year] == "undefined")
                            res.end(JSON.stringify({ "coord" : ''}));    
                        else
                            res.end(JSON.stringify({ "coord" : docs[0][year] }));
                    } 
            });
    };
}

exports.getPlayerShots = function(db) {
    return function(req, res) {

        var lock = 3;
        var yeardata = {};
        

        for(var year=2010; year<=2012; year++)
        {
            getData(year);
        }

        function getData(year)
        {
            var collection = db.collection('playerShot');
            collection.aggregate(
                { $unwind : "$" + year}, 
                { $group : {_id : "$player" , number : { $sum : 1 }}}, 
                { $sort : {number : -1 }}, 
                { $limit : 10 } , function(err, docs) {
                    var playerNames = [];
                    console.log(docs);
                    for(var i=0; i<docs.length; i++)
                    {   
                        playerNames.push(docs[i]._id);
                    }

                    var obj = {}
                    obj[year] = 1;
                    obj['player'] = 1;

                    collection.find({'player': {'$in' : playerNames}}, obj).toArray(function(error, documents){
                        var finaldata = [], tablePlayers =[];
                        var tableColumns = [{'sTitle': "Players"}];
                        for(var h=1; h<=30; h++)
                            {
                                var tab = {};
                                tab['sTitle'] = h + ' Feet'
                                tableColumns.push(tab);
                            }

                        for(var i=0; i<documents.length;i++)
                        {
                            var results = {};
                            var data = [];
                            var tablePlayer = [];
                            
                            tablePlayer.push(documents[i].player);
                            data.push(documents[i].player);
                            data.push(0);

                            for(var j=0; j<documents[i][year].length ;j++)
                            {
                                var x1 = 25 - parseInt(documents[i][year][j].x)/10;
                                var x1 = x1*x1;
                                var y1 = 5.25 - parseInt(documents[i][year][j].y)/10;
                                var y1 = y1*y1;

                                if(typeof results[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                                    results[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                                
                                results[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                                results[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[i][year][j].result;
                            }
                            

                            for(var key in results)
                            {
                                if(parseInt(key) <= 30)
                                {   
                                    tablePlayer[parseInt(key)] = results[key].totalshots;
                                    data[parseInt(key)+1] = (results[key].madeshots/results[key].totalshots).toFixed(2);
                                }
                            }

                            for(var k=2; k<=31; k++)
                            {
                                if(typeof data[k] == "undefined")
                                {
                                    data[k] = 0;
                                    tablePlayer[k-1] = 0;
                                }
                            }
                            finaldata.push(data);
                            tablePlayers.push(tablePlayer);
                        }

                        lock -= 1;
                        yeardata[year] = finaldata;
                        yeardata[year+"table"] = tablePlayers;
                        yeardata[year+"col"] = tableColumns;

                        if (lock === 0) {
                            finishRequest();
                        }
                    });
                });
            }

            function finishRequest()
            {
                var data = [];
                var years = [];
                var tableP = [];
                var tableC = [];

                for(var year = 2010; year<=2012; year++)
                {
                    data.push(yeardata[year]);
                    years.push(year);
                    tableP.push(yeardata[year+"table"]);
                    tableC.push(yeardata[year+"col"]);
                }
                res.render('charts', {data: JSON.stringify(data), year: JSON.stringify(years), table : JSON.stringify(tableP), columns : JSON.stringify(tableC) });
            }

    };
}

exports.getPlayerShots2013 = function(db) {
    return function(req, res) {

        var lock = 3;
        var yeardata = {};

        for(var year=2010; year<=2012; year++)
        {
            getData(year);
        }

        function getData(year)
        {
            var collection = db.collection('playerShot');
            collection.aggregate(
                { $unwind : "$" + year}, 
                { $group : {_id : "$player" , number : { $sum : 1 }}}, 
                { $sort : {number : -1 }}, 
                { $limit : 10 } , function(err, docs) {
                    var playerNames = [];
                    for(var i=0; i<docs.length; i++)
                    {   
                        playerNames.push(docs[i]._id);
                    }

                    var obj = {}
                    obj[year] = 1;
                    obj['player'] = 1;

                    collection.find({'player': {'$in' : playerNames}}, obj).toArray(function(error, documents){

                        var finaldataLeft = [], finaldataRight = [], finaldataCenter = [];
                        var tablePlayersLeft = [], tablePlayersRight = [], tablePlayersCenter =[];
                        var tableColumns = [{'sTitle': "Players"}];
                        for(var h=1; h<=30; h++)
                        {
                                var tab = {};
                                tab['sTitle'] = h + ' Feet'
                                tableColumns.push(tab);
                        }
                        
                        for(var i=0; i<documents.length;i++)
                        {
                            var resultsLeft = {}, resultsRight = {}, resultsCenter = {};
                            var dataLeft = [], dataRight = [], dataCenter = [];
                            dataLeft.push(documents[i].player);
                            dataLeft.push(0);
                            dataRight.push(documents[i].player);
                            dataRight.push(0);
                            dataCenter.push(documents[i].player);
                            dataCenter.push(0);

                            var tablePlayerLeft = [], tablePlayerRight =[], tablePlayerCenter = [];
                            tablePlayerLeft.push(documents[i].player);
                            tablePlayerRight.push(documents[i].player);
                            tablePlayerCenter.push(documents[i].player);

                            for(var j=0; j<documents[i][year].length ;j++)
                            {
                                var angleDeg = Math.atan2((documents[i][year][j].y/10) - 5.25, (documents[i][year][j].x/10)-25) * 180 / Math.PI
                                
                                var x1 = 25 - parseInt(documents[i][year][j].x)/10;
                                var x1 = x1*x1;
                                var y1 = 5.25 - parseInt(documents[i][year][j].y)/10;
                                var y1 = y1*y1;

                                if(angleDeg > 120 || (angleDeg <= -90 && angleDeg >= -180))
                                {
                                    if(typeof resultsLeft[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                                        resultsLeft[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                                    
                                    resultsLeft[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                                    resultsLeft[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[i][year][j].result;
                                }

                                else if(angleDeg < 60 || (angleDeg > -90 && angleDeg < 0))
                                {
                                    if(typeof resultsRight[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                                        resultsRight[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                                    
                                    resultsRight[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                                    resultsRight[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[i][year][j].result;
                                }

                                else
                                {
                                    if(typeof resultsCenter[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                                        resultsCenter[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                                    
                                    resultsCenter[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                                    resultsCenter[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[i][year][j].result;
                                }
                            }
                            for(var key in resultsLeft)
                            {
                                if(parseInt(key) <= 30)
                                {
                                    dataLeft[parseInt(key)+1] = (resultsLeft[key].madeshots/resultsLeft[key].totalshots).toFixed(2);
                                    tablePlayerLeft[parseInt(key)] = resultsLeft[key].totalshots;
                                }
                            }

                            for(var key in resultsRight)
                            {
                                if(parseInt(key) <= 30)
                                {
                                    dataRight[parseInt(key)+1] = (resultsRight[key].madeshots/resultsRight[key].totalshots).toFixed(2);
                                    tablePlayerRight[parseInt(key)] = resultsRight[key].totalshots;
                                }
                            }

                            for(var key in resultsCenter)
                            {
                                if(parseInt(key) <= 30)
                                {
                                    dataCenter[parseInt(key)+1] = (resultsCenter[key].madeshots/resultsCenter[key].totalshots).toFixed(2);
                                    tablePlayerCenter[parseInt(key)] = resultsCenter[key].totalshots;
                                }
                            }

                            for(var k=2; k<=31; k++)
                            {
                                if(typeof dataLeft[k] == "undefined")
                                {
                                    dataLeft[k] = 0;
                                    tablePlayerLeft[k-1] = 0;
                                }
                                if(typeof dataRight[k] == "undefined")
                                {
                                    dataRight[k] = 0;
                                    tablePlayerRight[k-1] = 0;
                                }
                                if(typeof dataCenter[k] == "undefined")
                                {
                                    dataCenter[k] = 0;
                                    tablePlayerCenter[k-1] = 0;
                                }
                            }  

                            finaldataLeft.push(dataLeft);
                            finaldataRight.push(dataRight);
                            finaldataCenter.push(dataCenter);
                            tablePlayersLeft.push(tablePlayerLeft);
                            tablePlayersRight.push(tablePlayerRight)
                            tablePlayersCenter.push(tablePlayerCenter);
                        }

                        lock -= 1;
                        yeardata["Left"+year] = finaldataLeft;
                        yeardata["Right"+year] = finaldataRight;
                        yeardata["Center"+year] = finaldataCenter;
                        yeardata["Left"+year+"table"] = tablePlayersLeft;
                        yeardata["Right"+year+"table"] = tablePlayersRight;
                        yeardata["Center"+year+"table"] = tablePlayersCenter;
                        yeardata[year+"col"] = tableColumns;

                        if (lock === 0) {
                            finishRequest();
                        }
                    });
                });
            }

            function finishRequest()
            {
                var data = [];
                var years = [];
                var tableP = [];
                var tableC = [];

                for(var year = 2010; year<=2012; year++)
                {
                    data.push(yeardata["Left"+year]);
                    data.push(yeardata["Right"+year]);
                    data.push(yeardata["Center"+year]);
                    years.push(year);
                    tableP.push(yeardata["Left"+year+"table"]);
                    tableP.push(yeardata["Right"+year+"table"]);
                    tableP.push(yeardata["Center"+year+"table"]);
                    tableC.push(yeardata[year+"col"]);
                    tableC.push(yeardata[year+"col"]);
                    tableC.push(yeardata[year+"col"]);
                }

                res.render('playercharts', {data: JSON.stringify(data), year: JSON.stringify(years), table : JSON.stringify(tableP), columns : JSON.stringify(tableC)});     
            }
    };
}

