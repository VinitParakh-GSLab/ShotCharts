$(document).ready(function() {

    var axis1 = new Object();
    var group1 = [];

    for (var j = 0; j < players.length; j++)
    {
        axis1[players[j]] = 'y';
        axis1['Shots'+players[j]] = 'y2';
        group1.push('Shots'+players[j]);
    }

    var typeofShot  = new Object();
    for (var j = 0; j < players.length; j++)
    {
        typeofShot['Shots'+players[j]] = 'bar';
        typeofShot[players[j]] = 'line';
    }

    for(var i=0; i<datanew.length; i++)
    {
        var chart = c3.generate({
        bindto: '#chart'+i,  
        data: {
            columns: datanew[i],
            axes: axis1,
            types : typeofShot,
            groups : [
                group1
            ]
        },
        axis: {
            x: {
                label: 'Distance in feet'
            },
            y: {
                label: 'Probability of shotmade'
            },
            y2 :
            {
                show : true,
                label : 'Total number of shots'
            }
        },
        zoom: {
            enabled: true
        }
        });

        chart.resize({height:350});

       /* $('#table'+i).dataTable({
        "aaData": tablePlayers[i],
        "aoColumns": tableColumns[i]
    } ); */   

    }
});
