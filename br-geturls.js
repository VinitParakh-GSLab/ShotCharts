pjs.addSuite({
    // single URL or array
    url: 'http://www.basketball-reference.com/boxscores/index.cgi?month=1&day=1&year=2013', 
    noConflict: true,
    /*moreUrls: function() {
    	var start_date = new Date("01/02/2013");
    	var end_date = new Date("04/30/2013");
    	var all_dates = [];

    	while(start_date <= end_date){
       		var temp_date = "month=" + (start_date.getMonth() + 1) + '&day=' + start_date.getDate() + '&year=' +  start_date.getFullYear();           
       		var url = 'http://www.basketball-reference.com/boxscores/index.cgi?' + temp_date;	
       		all_dates.push(url);
       		var newDate = start_date.setDate(start_date.getDate() + 1);
       		start_date = new Date(newDate);
    	}
    	return all_dates;
    },*/

    // single function or array, evaluated in the client
    scraper: function() {
        
        var gameday_urls = {'pbp' : [],
                            'shot_chart' : [],
                            'boxscores' : [],
                            'plus_minus' : []
                           };

        var base_url = 'http://www.basketball-reference.com';
        
        _pjs.$('div#boxes.stw table.medium_text tbody tr td table tbody tr td.align_center a').each(function(){
            var all_urls = base_url + _pjs.$(this).attr('href');
            if(all_urls.indexOf('/boxscores/pbp/') != -1)
               gameday_urls['pbp'].push(all_urls);
            else if(all_urls.indexOf('/boxscores/shot-chart/') != -1)
                gameday_urls['shot_chart'].push(all_urls);
            else if(all_urls.indexOf('/boxscores/') != -1)
            {
                gameday_urls['boxscores'].push(all_urls);
                all_urls = all_urls.split('/boxscores/')[0] + '/boxscores/plus-minus/' + all_urls.split('/boxscores/')[1]
                gameday_urls['plus_minus'].push(all_urls);
            }
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
    writer: 'my_file',
    outFile: 'BR/FINAL/output_temp6.js'
});