pjs.addSuite({
    // single URL or array
    url: 'http://scores.espn.go.com/nba/scoreboard?date=20130501', 
    noConflict: true,
    moreUrls: function() {
        var start_date = new Date("01/01/2011");
        var end_date = new Date("04/30/2011");
        var all_dates = [];

        while(start_date <= end_date){
            var temp_date = start_date.toJSON().split('T')[0].replace(/-/g,'')           
            var url = 'http://scores.espn.go.com/nba/scoreboard?date=' + temp_date;   
            all_dates.push(url);
            var newDate = start_date.setDate(start_date.getDate() + 1);
            start_date = new Date(newDate);
        }
        return all_dates;
    },

    // single function or array, evaluated in the client
    scraper: function() {
        var gameday_urls = {'pbp' : []};
        var base_url = 'http://scores.espn.go.com/nba/playbyplay?gameId='; 
        _pjs.$('div.gameDay-Container div.score-row').children().each(function(){
            var all_urls = base_url + _pjs.$('div', this).attr('id').split('-')[0] + '&period=0';
            gameday_urls['pbp'].push(all_urls);
        }); 
        return gameday_urls;
    }
});

pjs.config({ 
    // options: 'stdout', 'file' (set in config.logFile) or 'none'
    log: 'stdout',
    logFile: 'log_urls.txt',
    // options: 'json' or 'csv'
    format: 'json',
    // options: 'stdout' or 'file' (set in config.outFile)
    writer: 'my_file_espn',
    outFile: 'output_espn15.js'
});
