  var Converter = require("/usr/local/lib/node_modules/csvtojson").core.Converter;
  var fs  = require("fs");
  var async = require("/usr/local/lib/node_modules/async");

  var mongo = require("/usr/local/lib/node_modules/mongodb").MongoClient;
  var monk = require("/usr/local/lib/node_modules/monk");
  var db = monk("localhost:27017/nodetest3");

  var year = 2013;
  var files = getFiles('../BR/FINAL1/' + year + "_new",'.csv');
  var rows = 0;

  //var files2 = getFiles('BR/FINAL/2013','.json');
  var csvFields = [' a1', ' a2', ' a3', ' a4', ' a5',
                  ' h1', ' h2', ' h3', ' h4', ' h5',
                  ' quarter',
                  ' time',
                  ' team',
                  ' eventtype',
                  ' assist',
                  ' awayjumpball',
                  ' block',
                  ' entered',
                  ' homejumpball',
                  ' left',
                  ' numfreeshot',
                  ' opponent',
                  ' outof',
                  ' player',
                  ' points',
                  ' possession',
                  ' reason',
                  ' result',
                  ' steal',
                  ' type',
                  ' x',
                  ' y',
                  ' score',
                  ' shotdistance'];

  var count = 0;
  getdifference(files[0]);
  //db.close();
  
  function getdifference (files1)
  {
    var jsonObj1;
  	var countkeys = 0;

    var season = getSeason(files1);
    console.log(season);

  	var csvConverter = new Converter();     

        csvConverter.from(files1);
  			csvConverter.on("record_parsed",function(resultRow,rawRow,rowIndex){

  				if(rawRow.length > csvFields.length)
  				{
  					var diff = rawRow.length - csvFields.length;
  					 for(var j=10; j<csvFields.length; j++)
              {
                resultRow[csvFields[j]] = rawRow[j+diff];
              }
  				}

  				else if(rawRow.length < csvFields.length)
  				{
  					  var diff = csvFields.length - rawRow.length;
              for(var j=csvFields.length-1; j>=10; j--)
              {
                 	resultRow[csvFields[j]] = resultRow[csvFields[j-diff]]
              }

              for(var j=1; j<=diff; j++)
              {
                resultRow[csvFields[10-j]] = '';
              }
  				}

          if(resultRow[' eventtype'] == 'shot' && resultRow[' player'] != "" && resultRow[' x'] != "" && resultRow[' y'] != "")
          {
            rows++;
            var player = resultRow[' player'];
            var x = resultRow[' x'];
            var y = resultRow[' y'];
            var score = resultRow[' score'];
            var quarter = resultRow[' quarter'];
            var shotype = resultRow[' type'];
            var points = resultRow[' points'];
            var time = resultRow[' time'];
            var assist = resultRow[' assist'];
            var block = resultRow[' block'];
            var teamtype;

            if(getTeamName(resultRow[" team"]) == files1.split("/")[4].split(".")[0].substr(9,3))
              teamtype = "home";
            else
              teamtype = "away";

            var result;
            if (resultRow[' result'] == 'made')
              result = 1;
            else if (resultRow[' result'] == 'missed')
              result = 0;

            var collection = db.get('playerShot');
            var obj =  { "x": x,
                            "y": y,
                            "result" : parseInt(result),
                            "year" : parseInt(season),
                            "quarter": parseInt(quarter),
                            "shotype": shotype, 
                            "points": parseInt(points),
                            "time" : time,
                            "teamtype" : teamtype,
                            "assist" : assist,
                            "blocked" : block,
                            "score" : score,
                            "player" : player.toLowerCase()
                          } ;

            var newobj = {};
            newobj[season] = obj;

            collection.insert(
              obj , function(err, doc)
              {
                  if (err) 
                    console.log(err);
                });    
            }       
  			});

        csvConverter.on("end_parsed",function(obj){
          if(count < files.length-1)
          {
            console.log("Insert done : " + files1);
            console.log("Rows: "+ rows);
            count++;
            getdifference(files[count]);
          }

        });
  }

  function getTeamName(name)
  {
    var teams = {
      "New Jersey Nets" : "NJN",
      "Golden State Warriors" : "GSW",
      "Los Angeles Clippers" : "LAC",
      "Los Angeles Lakers" : "LAL",
      "New Orleans Hornets" : "NOH",
      "New York Knicks" : "NYK",
      "Oklahoma City Thunder" : "OKC",
      "San Antonio Spurs" : "SAS",
      "Utah Jazz" : "UTH"
    }

    if(typeof teams[name] != "undefined")
        return teams[name];
    else
      return name.substr(0,3).toUpperCase();
  }

  function getSeason(files1)
  {
    var month = parseInt(files1.split(year)[2].split(".html")[0].substr(0,2));
    if(month < 10)
      return (year-1);
    else
      return year;
  }

  function getFiles(dir, type){
  	 var files = fs.readdirSync(dir);
      var filenames = [];
      for(var i in files){
          if (!files.hasOwnProperty(i)) continue;  
          var name = dir+'/'+files[i];
          if(name.indexOf(type) != -1)
              filenames.push(name);
      }
      return filenames;
  }
