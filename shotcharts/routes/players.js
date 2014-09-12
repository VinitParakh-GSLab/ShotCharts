exports.getPlayers = function(db){

    return function(req, res) { 
            
            var collection = db.collection('playerShot');
            
            var query = {
                player: {
                    $regex: new RegExp("^" + req.query.player.toLowerCase() + ".*"),
                }
            };

            var obj = {};
            obj['player'] = 1;

            collection.find(query,obj).toArray(function(err, docs) {
                    res.setHeader('Content-Type', 'application/json');                    
                    if(err)
                    {
                        console.log(err);
                        res.end(JSON.stringify({ "players" : ''}));    
                    }
                    else
                    {
                        if(typeof docs == "undefined")
                            res.end(JSON.stringify({ "players" : ''}));    
                        else
                        {
                            var players = [], finalplayer = [];
                            for(var i=0; i<docs.length;i++)
                                players.push(docs[i].player)
                        }

                        finalplayer = players.unique();
                        console.log(finalplayer);                        
                        res.end(JSON.stringify({ "players" : finalplayer }));
                    }               
            });

        Array.prototype.unique = function() {
            var unique = [];
            for (var i = 0; i < this.length; i++) {
                if (unique.indexOf(this[i]) == -1) {
                    unique.push(this[i]);
                }
            }
            return unique;
        };
    };
}

exports.getShots = function(db) {
    return function(req, res) {

            var collection = db.collection('playerShot');
            var year  = req.query.year;

            var query = {
                player: req.query.player.toLowerCase(),
                year : parseInt(req.query.year)
            };

            collection.find(query).toArray(function(err, docs) {
                    res.setHeader('Content-Type', 'application/json');

                    if(err)
                    {
                        console.log(err);
                        res.end(JSON.stringify({ "error" : 'Player not found'}));    
                    }
                    else
                    {
                        if(typeof docs == "undefined")
                            res.end(JSON.stringify({ "coord" : ''}));    
                        else
                            res.end(JSON.stringify({ "coord" : docs}));
                    } 
            });
    };
}

exports.getPlayerShots = function(db) {
    return function(req, res) {
        getData();
        
        function getData()
        {
            var lock = 10;
            var finaldata = [], finalshots = [], players = [];

            var collection = db.collection('playerShot');
            collection.aggregate(
                { $group : {_id : "$player" , number : { $sum : 1 }}}, 
                { $sort : {number :-1 }}, 
                { $limit : lock } , function(err, docs) {        
                    var playerNames = [];
                    for(var i=0; i<docs.length; i++)
                    {   
                        playerNames.push(docs[i]._id);
                    }

                    for(var i=0 ; i<playerNames.length; i++)
                    {
                        collection.find({'player': playerNames[i]}).toArray(function(error, documents){
                        var results = {'totalshots' : 0, 'madeshots' : 0};
                        var data = [documents[0].player, 0];
                        var shots = ["Shots"+documents[0].player, 0];

                        for(var j=0; j<documents.length ;j++)
                        {
                                var x1 = 25 - parseInt(documents[j].x)/10;
                                var x1 = x1*x1;
                                var y1 = 5.25 - parseInt(documents[j].y)/10;
                                var y1 = y1*y1;

                                if(typeof results[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                                    results[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                                
                                results[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                                results[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[j].result;
                        }
                            

                        for(var key in results)
                        {
                                if(parseInt(key) <= 30)
                                {   
                                    if(results[key].totalshots == 0)
                                    {
                                        data[parseInt(key)+1] = 0;
                                    }
                                    else
                                    {
                                        data[parseInt(key)+1] = (results[key].madeshots/results[key].totalshots).toFixed(2);
                                    }
                                    shots[parseInt(key)+1] = results[key].totalshots;
                                }
                        }
                        
                        for(var k=2; k<=31; k++)
                        {
                            if(typeof data[k] == "undefined")
                            {
                                data[k] = 0;
                                shots[k] = 0;
                            }
                        }

                        finaldata.push(data);
                        finalshots.push(shots);
                        players.push(documents[0].player);

                        lock -= 1;
                        if (lock == 0) {
                            var data = [];
                            for(var k=0; k<finalshots.length; k++)
                            {
                                finaldata.push(finalshots[k]);
                            }
                            var finald = [];
                            finald.push(finaldata);
                            res.render('charts', {data: JSON.stringify(finald), players: JSON.stringify(players)});
                        }
                        
                    });    
                }
            });
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
                { $limit : 20 } , function(err, docs) {
                    var playerNames = [];
                    for(var i=0; i<docs.length; i++)
                    {   
                        playerNames.push(docs[i]._id);
                    }
                    console.log(playerNames);
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
                        

                        console.log(documents);

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

                        /*yeardata["Left"].push(finaldataLeft);
                        yeardata["Right"].push(finaldataRight);
                        yeardata["Center"].push(finaldataCenter);
                        yeardata["Left table"].push(tablePlayersLeft);
                        yeardata["Right table"].push(tablePlayersRight);
                        yeardata["Center table"].push(tablePlayersCenter);*/

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

                /*data.push(yeardata["Left"]);
                data.push(yeardata["Right"]);
                data.push(yeardata["Center"]);
                years.push(2011);
                tableP.push(yeardata["Left table"]);
                tableP.push(yeardata["Right table"]);
                tableP.push(yeardata["Center table"]);
                tableC.push(yeardata[year+"col"]);*/
                
                res.render('playercharts', {data: JSON.stringify(data), year: JSON.stringify(years), table : JSON.stringify(tableP), columns : JSON.stringify(tableC)});     
            }
    };
}

exports.getShotDivision = function(db)
{
    return function(req, res) {
        var collection = db.collection('playerShot');
        
        var obj = {};
        obj['x'] = true;
        obj['y'] = true;
        obj['result'] = true;


        var dataLeft = ["Left", 0];
        var dataRight = ["Right", 0];
        var dataCenter = ["Center", 0];
        var shotsleft = ["ShotsLeft", 0], shotsright = ["ShotsRight", 0], shotscenter = ["ShotsCenter", 0];
        var resultsLeft = {}, resultsRight = {}, resultsCenter = {};

        collection.find({}, obj).toArray(function(error, documents){
            for(var j=0; j<documents.length ;j++)
            {
                var angleDeg = Math.atan2((documents[j].y/10)-5.25, (documents[j].x/10)-25) * 180 / Math.PI
                
                if(angleDeg == -90)
                {
                    if(Math.floor(Math.random() * 2) == 1)
                        angleDeg = -89;
                }

                var x1 = 25 - parseInt(documents[j].x)/10;
                var x1 = x1*x1;
                var y1 = 5.25 - parseInt(documents[j].y)/10;
                var y1 = y1*y1;

                if(angleDeg > 120 || (angleDeg <= -90 && angleDeg >= -180))
                {
                    if(typeof resultsLeft[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                        resultsLeft[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                    
                    resultsLeft[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                    resultsLeft[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[j].result;
                }

                else if(angleDeg < 60 || (angleDeg > -90 && angleDeg < 0))
                {
                    if(typeof resultsRight[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                        resultsRight[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                    
                    resultsRight[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                    resultsRight[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[j].result;
                }

                else
                {
                    if(typeof resultsCenter[Math.ceil(Math.sqrt(x1+y1))] == 'undefined' )
                        resultsCenter[Math.ceil(Math.sqrt(x1+y1))] = {'totalshots' : 0, 'madeshots' : 0};
                    
                    resultsCenter[Math.ceil(Math.sqrt(x1+y1))]['totalshots']++;    
                    resultsCenter[Math.ceil(Math.sqrt(x1+y1))]['madeshots'] += documents[j].result;
                }
            }

            for(var key in resultsLeft)
            {
                if(parseInt(key) <= 30)
                {
                    if(resultsLeft[key].totalshots == 0)
                    {
                        dataLeft[parseInt(key)+1] = 0;
                    }   
                    else
                    {
                        dataLeft[parseInt(key)+1] = (resultsLeft[key].madeshots/resultsLeft[key].totalshots).toFixed(2);    
                    }
                    shotsleft[parseInt(key)+1] = resultsLeft[key]['totalshots'];
                }
            }

            for(var key in resultsRight)
            {
                if(parseInt(key) <= 30)
                {
                    if(resultsRight[key].totalshots == 0)
                    {
                        dataRight[parseInt(key)+1] = 0;
                    }   
                    else
                    {
                        dataRight[parseInt(key)+1] = (resultsRight[key].madeshots/resultsRight[key].totalshots).toFixed(2);    
                    }
                    shotsright[parseInt(key)+1] = resultsRight[key]['totalshots'];
                }
            }

            for(var key in resultsCenter)
            {
                if(parseInt(key) <= 30)
                {
                    if(resultsCenter[key].totalshots == 0)
                    {
                        dataCenter[parseInt(key)+1] = 0;
                    }   
                    else
                    {
                        dataCenter[parseInt(key)+1] = (resultsCenter[key].madeshots/resultsCenter[key].totalshots).toFixed(2);    
                    }
                    shotscenter[parseInt(key)+1] = resultsCenter[key]['totalshots'];
                }
            }


            for(var k=2; k<=31; k++)
            {
                if(typeof dataLeft[k] == "undefined")
                {
                    dataLeft[k] = 0;
                    shotsleft[k] = 0
                }
                if(typeof dataRight[k] == "undefined")
                {
                    dataRight[k] = 0;
                    shotsright[k] = 0;
                }
                if(typeof dataCenter[k] == "undefined")
                {
                    dataCenter[k] = 0;
                    shotscenter[k] = 0;
                }
            }  
            
            var data = [];
            data.push(dataLeft);
            data.push(dataRight);
            data.push(dataCenter);
            data.push(shotsleft);
            data.push(shotsright);
            data.push(shotscenter);
            
            var finaldata = [];
            finaldata.push(data);

            res.render('newcharts', {data: JSON.stringify(finaldata)});
        });
    }
}

exports.getShotPlayerCharts = function(db)
{
    return function(req, res) {

        getData();

        function getData()
        {
            var lock = 15;
            var players = [];
            var dataLeft = ["Left"];
            var dataRight = ["Right"];
            var dataCenter = ["Center"];
            var shotsleft = ["ShotsLeft"], shotsright = ["ShotsRight"], shotscenter = ["ShotsCenter"];
                    
            var collection = db.collection('playerShot');
            collection.aggregate(
                { $group : {_id : "$player" , number : { $sum : 1 }}}, 
                { $sort : {number :-1 }}, 
                { $limit : lock } , function(err, docs) {        
                    var playerNames = [];
                    for(var i=0; i<docs.length; i++)
                    {   
                        playerNames.push(docs[i]._id);
                    }

                    for(var i=0 ; i<playerNames.length; i++)
                    {
                        collection.find({'player': playerNames[i]}).toArray(function(error, documents){
                        var resultsLeft = {'totalshots' : 0, 'madeshots' : 0}, resultsRight = {'totalshots' : 0, 'madeshots' : 0}, resultsCenter = {'totalshots' : 0, 'madeshots' : 0};
                        
                        for(var j=0; j<documents.length ;j++)
                        {
                            var angleDeg = Math.atan2((documents[j].y/10) - 5.25, (documents[j].x/10)-25) * 180 / Math.PI
                            
                            var x1 = 25 - parseInt(documents[j].x)/10;
                            var x1 = x1*x1;
                            var y1 = 5.25 - parseInt(documents[j].y)/10;
                            var y1 = y1*y1;

                            if(angleDeg > 120 || (angleDeg < -90 && angleDeg >= -180))
                            {
                                resultsLeft['totalshots']++;    
                                resultsLeft['madeshots'] += documents[j].result;
                            }

                            else if(angleDeg < 60 || (angleDeg >= -90 && angleDeg < 0))
                            {
                                resultsRight['totalshots']++;    
                                resultsRight['madeshots'] += documents[j].result;
                            }

                            else
                            {
                                resultsCenter['totalshots']++;    
                                resultsCenter['madeshots'] += documents[j].result;
                            }
                        }

                        dataLeft.push(resultsLeft.madeshots/resultsLeft.totalshots).toFixed(2);
                        dataRight.push(resultsRight.madeshots/resultsRight.totalshots).toFixed(2);
                        dataCenter.push(resultsCenter.madeshots/resultsCenter.totalshots).toFixed(2);
                        shotsleft.push(resultsLeft.totalshots);
                        shotsright.push(resultsRight.totalshots);
                        shotscenter.push(resultsCenter.totalshots);
 
                        players.push(documents[0].player);
                        lock--;

                        if(lock == 0)
                        {
                            var data = [];
                            data.push(dataLeft);
                            data.push(dataRight);
                            data.push(dataCenter);
                            data.push(shotsleft);
                            data.push(shotsright);
                            data.push(shotscenter);
                            
                            var finaldata = [];
                            finaldata.push(data);

                            res.render('newplayercharts', {data: JSON.stringify(finaldata), players : JSON.stringify(players)});     
                        }
                    });
                }
            });
        }
    };
}

