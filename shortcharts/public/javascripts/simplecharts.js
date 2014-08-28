$(document).ready(function() {

    for(var i=0; i<datanew.length; i++)
    {
        var chart = c3.generate({
        bindto: '#chart'+i,  
        data: {
            columns: datanew[i]
        },
        axis: {
            x: {
                label: 'Distance in feet'
            },
            y: {
                label: 'Probability of shotmade'
            }
        },
        zoom: {
            enabled: true
        }
        });

        chart.resize({height:350});

        $('#table'+i).dataTable({
        "aaData": tablePlayers[i],
        "aoColumns": tableColumns[i]
    } );    

    }
});
