pjs.addSuite({
    // single URL or array
    url: urls.pbp,
    noconflict: true,
    preScrape: function() {
        _pjs.filename = window.location.href;
    },

    // single function or array, evaluated in the client
    scraper: function() {
        
        var finalresult = {
            content : [],
            filename : '/home/vinit/Desktop/DR/ESPN/'
            };

        var result = [], team = [];
        var quarter = 0, i=0;

        var date = new Date(_pjs.$('div.game-time-location p:nth-child(1)').text().split('ET, ')[1]);
        finalresult.filename += date.getFullYear() + '/' + date.toJSON().split('T')[0].replace(/-/g,'') + '0' + _pjs.$('div.line-score-container tbody tr:nth-child(3) td:nth-child(1)').text() + '.csv'

        alert(finalresult.filename);
        
        _pjs.$("div.team-info h3 a").each(function(){
            team[i++] = $(this).text();
        });

        var hometeam = team[1];
        var awayteam = team[0];

        _pjs.$('div.mod-content:nth-child(1) table tr').each(function() {
                var tempresult = {};      
                 
                //quarter  
                if(typeof _pjs.$(this).attr('bgcolor') != 'undefined')
                {
                    quarter++;
                    return true;
                }

                //ignoring certain rows
                if(_pjs.$('td:nth-child(2)', this).text().indexOf('Start of') != -1 || _pjs.$('td:nth-child(2)', this).text().indexOf('End of') != -1 ||  _pjs.$('td:nth-child(2)', this).text().indexOf('End Game') != -1 || $('th:nth-child(1)', this).text() == 'TIME')
                    return true;
                
                tempresult['time'] = $('td:nth-child(1)', this).text();
                tempresult['quarter'] = quarter;
                tempresult['score'] = $('td:nth-child(3)', this).text();

                if($('td:nth-child(2)', this).text() != String.fromCharCode(160))
                {
                    tempresult['team'] = awayteam;
                    tempresult['text'] = $('td:nth-child(2)', this).text();
                }
                else
                {
                    tempresult['team'] = hometeam;
                    tempresult['text'] = $('td:nth-child(4)', this).text();
                }

                //alert(tempresult);
                finalresult.content.push(tempresult);
        });
            //alert(result);
            //finalresult.content['pbp'] = result;
            return finalresult;
    }
    
});

pjs.config({ 
    // options: 'stdout', 'file' (set in config.logFile) or 'none'
    log: 'stdout',
    logFile: 'scrape_espn1.txt',
    // options: 'json' or 'csv'
    format: 'csv',
    // options: 'stdout' or 'file' (set in config.outFile)
    writer: 'itemfile',
    csvFields: ['time', 'team', 'quarter', 'score' ,'text']
    //outFile: 'scrape_output2.csv'
});
