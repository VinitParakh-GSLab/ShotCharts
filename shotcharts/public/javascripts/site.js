$(document).ready(function() {

  var points = [], datapoints = {};
  var filters = {
    'quarter' : false,
    'teamtype' : false,
    'shottype' : false,
    'scoremargin' : false
  }

  $('#radius').arrowIncrement({
    delta: 0.5,
    min: 0,
    max: 50
  });


  $('#radius').on('change', function(){
      filter_data();
  });

  $('.filter_margin').on('change', function(){
      if($(this).val() == 'all')
          filters.scoremargin = false;
      else
          filters.scoremargin = true;

        filter_data();
  });  

  $('.choose_report').on('change', function(){
       getData();
  });

  $('.filter_shot_type').on('change', function(){
        if($(this).val() == 'all')
          filters.shottype = false;
        else
          filters.shottype = true;

        filter_data();
  });

  $(".btn-group .filter_period").on('click', function (e) {
      
    var hasClass = $(this).hasClass("btn-inverse");
    $(".btn-group .filter_period").removeClass("btn-inverse");
        
    if(!hasClass)
    {
      $(this).addClass("btn-inverse");
      filters.quarter = true;
    }
    else
    {
      filters.quarter = false;
    }

    filter_data();
  });

  $(".btn-group .button_chart_ui").on('click', function (e) {
      
    var hasClass = $(this).hasClass("btn-inverse");
    $(".btn-group .button_chart_ui").removeClass('btn-inverse');
    
    if(!hasClass)
    {
      $(this).addClass('btn-inverse');
    }

    if($(this).attr("id") == "Shot Location")
      filter_data();
    else if($(this).attr("id") == "Shot Zones")
      filter_data();
    else if($(this).attr("id") == "2s/3s/Paint")
      point_paint();
    else if($(this).attr("id") == "Left/Right/Center")
      filter_data();
  });

  $(".btn-group .filter_homeaway").on('click', function (e) {
      
    var hasClass = $(this).hasClass("btn-inverse");
    $(".btn-group .filter_homeaway").removeClass('btn-inverse');
    
    if(!hasClass)
    {
      $(this).addClass('btn-inverse');
      filters.teamtype = true;
    }
    else
    {
      filters.teamtype = false;
    }
    
    filter_data();
  });

  $("#submit").click(function(){
      if($("#search").val() != "")
        getData();
      else
        alert("Please search for a player!");
  });

  $("#search").autocomplete({
      minLength: 2,
      source: function( request, response ) 
      {
          $.ajax( {
            url : "/getPlayers?player=" + request.term, 
            success : function(data) { 
		          response(data.players); 
            }
          });
      },
  });

  function getData()
  {
      $.ajax({
      url: '/getShots',
      type: 'GET',
      data: {'player' : $("#search").val(),
              'year' : $(".choose_report").val()},
      success: function (data) {         
          if(typeof data.coord.error != "undefined")
            alert("Player not Found");
          else
          {
            $.extend(datapoints,data);
            filter_data();
          }
        }
      });
  }

  function repaint()
  {
      $(".hexagon").remove();

      var rad;
      if($("#radius").val() == '' || isNaN($("#radius").val()))
        rad = 1.5;
      else
        rad = $("#radius").val();
      
        svg.selectAll(".hexagon")
              .data(hexbin(points))
              .enter().append("path")
              .attr("class", "hexagon")
              .attr("d", function(d) {
                  return hexbin.hexagon(radius(d.length)); 
                })
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
              .style("fill", function(d) {
                totalshots = 0;
                madeshots = 0;
                for(var i=0;i<points.length;i++)
                {
                  var x1 = d.x - points[i][0];
                  var x1 = x1*x1;
                  var y1 = d.y - points[i][1];
                  var y1 = y1*y1;

                  if(Math.round(Math.sqrt(x1+y1)) <= rad*10)
                  {
                    totalshots += 1;
                    if(points[i][2] == 1)
                        madeshots += 1;
                  }
                }

                var percent = (madeshots/totalshots) * 100;
                return color(percent); 
              });
              /*.on("click", function(d){ 
                var urls = [];
                for(var i=0;i<points.length;i++)
                {
                  var x1 = d.x - points[i][0];
                  var x1 = x1*x1;
                  var y1 = d.y - points[i][1];
                  var y1 = y1*y1;

                  if(Math.round(Math.sqrt(x1+y1)) <= rad*10)
                  {
                    urls.push(points[i][3]);
                  }
                }
                
                //URLS HERE
                console.log(urls);
              });*/
    }

    function filter_data()
    {
      var playerName = $("#search").val();
      var totalshots = 0;
      var shotscounted = 0;
      var totalpoints = 0;
      points = [];
      var quarter;

      if(typeof datapoints.coord != "undefined")
      {
        for(var i=0; i<datapoints.coord.length; i++)
        {
          if(datapoints.coord[i].x != "" && datapoints.coord[i].year == $(".choose_report").val()
            && (!filters.quarter || ("period" + datapoints.coord[i].quarter) == $(".btn-group .filter_period.btn-inverse").attr("id"))
          && (!filters.teamtype || (datapoints.coord[i].teamtype) == $(".btn-group .filter_homeaway.btn-inverse").attr("id"))
          && (!filters.shottype || (datapoints.coord[i].shotype).indexOf($('.filter_shot_type').val()) != -1)
          && (!filters.scoremargin || (checkMargin(datapoints.coord[i].teamtype, datapoints.coord[i].score, parseInt($('.filter_margin').val()))))
           )

            {
              var point = [];
              point.push(datapoints.coord[i].x);
              point.push(datapoints.coord[i].y);
              point.push(datapoints.coord[i].result);
              //point.push(datapoints.coord[i].url);
              //console.log(point);
              points.push(point);

              totalshots += 1;
              shotscounted += datapoints.coord[i].result;
              if(datapoints.coord[i].result == 1)
                totalpoints += parseInt(datapoints.coord[i].points);
            }
      } 

      repaint();
      $("#totalshots").text(totalshots);
      $("#playername").text(playerName);
      if(totalshots == 0)
      {
        $("#fg").text("N/A");
        $("#ptshot").text("N/A");
      }
      else
      {
        $("#fg").text((shotscounted*100/totalshots).toFixed(2));
        $("#ptshot").text((totalpoints/totalshots).toFixed(2));  
      } 
      
    }
  }

  function camelCase(input) { 
    return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
        return group1.toUpperCase();
    });
  }

  function checkMargin(team, score, marginValue)
  {
    var scoreDiff = score.split("-")[0] - score.split("-")[1];

    if(team == "home")
      scoreDiff *= -1;

    if(marginValue == -15)
    {
      if(scoreDiff >= -100 && scoreDiff <= -15)
        return true;
    }

    if(marginValue == -7)
    {
      if(scoreDiff >= -14 && scoreDiff <= -7)
        return true;
    }

    if(marginValue == -1)
    {
      if(scoreDiff >= -6 && scoreDiff <= -1)
        return true;
    }

    if(marginValue == 0)
    {
      if(scoreDiff == 0)
        return true;
    }

    if(marginValue == 15)
    {
      if(scoreDiff <= 100 && scoreDiff >= 15)
        return true;
    }

    if(marginValue == 7)
    {
      if(scoreDiff <= 14 && scoreDiff >= 7)
        return true;
    }

    if(marginValue == 1)
    {
      if(scoreDiff <= 6 && scoreDiff >= 1)
        return true;
    }
    return false;
  }


var svg = d3.select("div#court").append("svg")
    .attr("width", 500)
    .attr("height", 470)
    .attr("class", "courts")
    .attr("viewBox","0,0,500,470")
    .attr("style","border: 1px solid #333; background-color: #E27F2E;")

var radius = d3.scale.quantize()
                .domain([1,20])
                .range([8, 12, 15]);

var color = d3.scale.linear()
    .domain([0,90])
    .range(["#9ECAE1", "#08306B"])
    .nice()
    .clamp(true)
    .interpolate(d3.interpolateLab);
    

var hexbin = d3.hexbin()
            .size([500, 470])
            .radius(15);

svg.append("rect")
   .attr("width", 500)
   .attr("height", 470)
   .attr("fill", "white")
   .attr("x", 0)
   .attr("y", 0)  
   .attr("stroke", "#777")
  .attr("fill", "none")
  .attr("stroke-width", 1);

svg.append("rect")
   .attr("width", 60)
   .attr("height",5)
   .attr("x", 220)
   .attr("y",35);
 
svg.append("rect")
   .attr("width", 120)
   .attr("height", 190)
   .attr("fill", "white")
  .attr("x", 190)
  .attr("y", 0)
  .attr("stroke", "#000")
  .attr("fill", "none")
  .attr("stroke-width", 4);

svg.append("circle")
.attr("cx", 250)
.attr("cy", 47)
.attr("r", 7)
.attr("stroke", "#000")
.attr("fill", "none")
.attr("stroke-width", 3);

svg.append("circle")
.attr("cx", 250)
.attr("cy", 190)
.attr("r", 60)
.attr("stroke", "#000")
.attr("fill", "none")
.attr("stroke-width", 4);

svg.append("path")
.attr("d", "M310,470 A50,50 0 0,0 190,470")
.attr("stroke", "#000")
.attr("fill", "none")
.attr("stroke-width", 4);

svg.append("path")
.attr("d", "M30,0 l0,141")
.attr("stroke", "#000")
.attr("fill", "none")
.attr("stroke-width", 4);

svg.append("path")
.attr("d", "M470,0 l0,141")
.attr("stroke", "#000")
.attr("fill", "none")
.attr("stroke-width", 4);

svg.append("path")
.attr("d", "M30,141 A237,237 0 0,0 250,287 A237,237 0 0,0 470,141")
.attr("stroke", "#000")
.attr("fill", "none")
.attr("stroke-width", 4);

});
