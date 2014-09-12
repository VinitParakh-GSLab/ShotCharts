$(document).ready(function() {

    for(var i=0; i<datanew.length; i++)
    {
        var chart = c3.generate({
        bindto: '#chart'+i,  
        data: {
            columns: datanew[i],
            axes: {
                Left: 'y',
                Right: 'y',
                Center : 'y',
                ShotsLeft : 'y2',
                ShotsRight : 'y2',
                ShotsCenter : 'y2'
            },
            type : 'bar',
            types : {
                Left : 'line',
                Right : 'line',
                Center : 'line'
            },
            groups : [
                ['ShotsLeft', 'ShotsRight', 'ShotsCenter']
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

        /*$('#table'+i).dataTable({
        "aaData": tablePlayers[i],
        "aoColumns": tableColumns[i]
    } );  */  

    }
});
