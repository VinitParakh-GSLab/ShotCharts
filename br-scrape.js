pjs.addSuite({

    // single URL or array
    url: urls.boxscores,
    noConflict: true,
    preScrape: function() {
        _pjs.filename = window.location.href;
    },
    // single function or array, evaluated in the client
    scraper: function() {     
        var finalresult = {
                      content: {},
                      filename : '/home/vinit/Desktop/DR/BR/FINAL1/' + _pjs.filename.split("boxscores/")[1].substr(0,4) + '/'+ _pjs.filename.split("boxscores/")[1] + '.json'
                      };
        
        var result = {};
        var team = {};

        var count = 0;
        //var div_id = _pjs.$('table.nav_table.no_highlight.stats_table tbody tr:nth-child(2) td.align_center.background_yellow td:nth-child(1) a').text()
        var awayteam = 'table#'+ _pjs.$('table.border_gray:nth-child(1) tbody tr.valign_top td:nth-child(1) span.bold_text.large_text a').attr('href').split('/')[2] + '_basic.sortable.stats_table tbody tr'; 

        _pjs.$(awayteam).each(function(){
            if(_pjs.$(this).attr('class') != 'no_ranker thead')
            {
                var key = _pjs.$('td:nth-child(1) a', this).attr('href');
                var value = _pjs.$('td:nth-child(1) a', this).text();
                team[key] = value;    
            }
        });

        var hometeam = 'table#'+ _pjs.$('table.border_gray:nth-child(1) tbody tr.valign_top td:nth-child(2) span.bold_text.large_text a').attr('href').split('/')[2] + '_basic.sortable.stats_table tbody tr';

        _pjs.$(hometeam).each(function(){
            if(_pjs.$(this).attr('class') != 'no_ranker thead')
            {
                var key = _pjs.$('td:nth-child(1) a', this).attr('href');
                var value = _pjs.$('td:nth-child(1) a', this).text();
                team[key] = value;
            }
        });

            finalresult.content['boxscores'] = team;
            return finalresult;
        }
    });

pjs.addSuite({
    // single URL or array
    url: urls.plus_minus,
    noConflict: true,
    preScrape: function() {
        _pjs.filename = window.location.href;
    },
    
    // single function or array, evaluated in the client
    scraper: function() {     
        var finalresult = {
                      content: {},
                      filename : '/home/vinit/Desktop/DR/BR/FINAL1/' + _pjs.filename.split("plus-minus/")[1].substr(0,4) + '/'+_pjs.filename.split("plus-minus/")[1] + '.json'
                      };
    
        var result = {};
        var hometeam = {'team': ''};

        var awayteam = {'team' : ''};

        var temp_team = [], temp_awayteam = [], quarter_limit = [0];
        var count = 0, count_awayteam = 0;

        var ateam = _pjs.$('table.border_gray:nth-child(1) tbody tr.valign_top td:nth-child(1) span.bold_text.large_text a').text();
        var hteam = _pjs.$('table.border_gray:nth-child(1) tbody tr.valign_top td:nth-child(2) span.bold_text.large_text a').text();

        hometeam.team = hteam;
        awayteam.team = ateam;

        _pjs.$("div#page_content table.margin_top tbody tr.valign_top td div[style *= 'width:'] div:nth-child(1) div.border.margin_top.padding_half.x_small_text span") .each(function(){
            count_awayteam++;
        });

        //get team
        _pjs.$("div#page_content table.margin_top tbody tr.valign_top td div[style *= 'width:'] div div.border.margin_top.padding_half.x_small_text span").each(function(){
            var text = $(this).text().split(' '); 
            temp_team.push($(this).text()); 
        });
    
        count = 0;
        var width = 0;
        _pjs.$("div#page_content table.margin_top tbody tr.valign_top td div[style *= 'width:'] div.border_bottom.border_left.border_right.overflow_hidden:first").children().each(function(){
            width = width + parseInt($(this).attr('style').split('width:')[1].split('px;'));
            quarter_limit.push(width);
        });

        var start_width, end_width;
        //get players for every quarter awayteam
        $("div#page_content table.margin_top tbody tr.valign_top td div[style *= 'width:'] div div.clear_both.border_bottom.border_left.nowrap.overflow_hidden").each(function(){        
                start_width = 0;
                end_width = 0;
                if(count >= count_awayteam)
                {
                    $('div.align_center', this).each(function(){
                    var class1 = $(this).attr('class');
                    end_width += parseInt($(this).attr('style').split('width:')[1].split('px;')); 

                    for(var j=0; j<(quarter_limit.length-1); j++)
                    {
                        var quarter_number = 'quarter_' + (j+1);
                        if(start_width <= quarter_limit[j] && end_width > quarter_limit[j] && class1.indexOf('background') != -1)    
                         {
                             if(typeof hometeam[quarter_number] == 'undefined')
                            {
                                hometeam[quarter_number] = new Array();
                                hometeam[quarter_number].push(temp_team[count]);
                            }                           
                            else
                               hometeam[quarter_number].push(temp_team[count]); 
                        }
                    }
                        start_width = end_width;
                    });
                }

                else
                {
                $('div.align_center', this).each(function(){
                    var class1 = $(this).attr('class');
                    end_width += parseInt($(this).attr('style').split('width:')[1].split('px;')); 
                    for(var j=0; j<(quarter_limit.length-1); j++)
                    {
                        var quarter_number = 'quarter_' + (j+1);

                        if(start_width <= quarter_limit[j] && end_width > quarter_limit[j] && class1.indexOf('background') != -1)    
                        {

                            if(typeof awayteam[quarter_number] == 'undefined')
                            {
                                awayteam[quarter_number] = new Array();
                                awayteam[quarter_number].push(temp_team[count]);
                            }                           
                            else
                               awayteam[quarter_number].push(temp_team[count]);                            
                        }
                    }
                        start_width = end_width;
                    });
                }
                count++;
        });

            result['hometeam'] = hometeam;
            result['awayteam'] = awayteam;
            result['quarter_0'] = {};

           finalresult.content['plus_minus'] = result;
           return finalresult;
        }
 });

pjs.addSuite({
    // single URL or array
    url:urls.pbp,
    noConflict: true,
    preScrape: function() {
        _pjs.filename = window.location.href;
    },
    // single function or array, evaluated in the client
    scraper: function() {     
        var finalresult = {
            content : {},
            filename : '/home/vinit/Desktop/DR/BR/FINAL1/' + _pjs.filename.split("pbp/")[1].substr(0,4) + '/' + _pjs.filename.split("pbp/")[1] + '.json'
            };
        
        var result = [];
        var quarter = 1, text, td_var;
        var awayteam = _pjs.$('table.border_gray:nth-child(1) tbody tr.valign_top td:nth-child(1) span.bold_text.large_text a').text();
        var hometeam = _pjs.$('table.border_gray:nth-child(1) tbody tr.valign_top td:nth-child(2) span.bold_text.large_text a').text();

        _pjs.$('div#page_content table.margin_top tbody tr table.no_highlight.stats_table:eq(1) tbody tr').slice(0).each(function() {
            

            //get the quarter number 
            if(typeof _pjs.$(this).attr('id') != 'undefined')
            {
                quarter = _pjs.$(this).attr('id').split('q')[1];
                    return true;
            }

            //ignoring certain rows
            if(_pjs.$('td:nth-child(2)', this).text().indexOf('Start of') != -1 ||_pjs.$('td:nth-child(2)', this).text().indexOf('End of') != -1 || $('th:nth-child(1)', this).text() == 'Time')
                return true;

            var tempresult = {
                quarter: quarter,
                time: _pjs.$('td:nth-child(1)', this).text(),
                team: '',
                eventtype: '',
                assist: {},
                awayjumpball: {},
                block: {},
                entered: {},
                homejumpball: {},
                lefts: {},
                numfreeshot: '',
                opponent: {},
                outof:'',
                player: {},
                points: '',
                possession: '',
                reason: '',
                result: '',
                steal: {},
                type: '',
                hometeam: [],
                awayteam: [],
                x: '',
                y: '',
                score: _pjs.$('td:nth-child(4)', this).text(),
                shotdistance: ''  
            };

            //get the team
            if (_pjs.$('td:nth-child(2)', this).text() != String.fromCharCode(160))
            {
                tempresult.team = awayteam;
                text = _pjs.$('td:nth-child(2)', this).text();
                td_var = 'td:nth-child(2)';
            }
            else
            {
                tempresult.team = hometeam;
                text = _pjs.$('td:nth-child(6)', this).text();
                td_var = 'td:nth-child(6)';
            }
 
            //order (if-else) is important!
            //get jump-ball details
            if(_pjs.$('td:nth-child(2)',this).text().indexOf('Jump ball') != -1)
            {
                tempresult.homejumpball['playerName'] = _pjs.$('td:nth-child(2) a:nth-child(1)',this).text();
                tempresult.homejumpball['href'] = _pjs.$('td:nth-child(2) a:nth-child(1)',this).attr('href');
                tempresult.awayjumpball['playerName']  = _pjs.$('td:nth-child(2) a:nth-child(2)',this).text();
                tempresult.awayjumpball['href'] = _pjs.$('td:nth-child(2) a:nth-child(2)',this).attr('href');      
                tempresult.possession['playerName'] = _pjs.$('td:nth-child(2) a:nth-child(3)',this).text();
                tempresult.possession['href'] = _pjs.$('td:nth-child(2) a:nth-child(3)',this).attr('href');
                tempresult.eventtype = 'jumpball';
                tempresult.team = '';
            }

            else if(_pjs.$(td_var, this).text().indexOf('Turnover') != -1)
            {
                var temp;
                tempresult.eventtype = 'turnover';
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName']= _pjs.$(temp, this).text();
                tempresult.player['href']= _pjs.$(temp, this).attr('href');
                
                if(text.indexOf('steal') != -1)
                {
                    temp = td_var + ' a:nth-child(2)';
                    tempresult.steal['playerName'] = _pjs.$(temp, this).text();
                    tempresult.steal['href'] = _pjs.$(temp, this).attr('href');
                    tempresult.reason = text.split('(')[1].split(';')[0];                        
                }
                else
                {
                    tempresult.reason = text.split('(')[1].split(')')[0];
                }
            }

            //get shot-details.
            else if(_pjs.$(td_var, this).text().indexOf('shot') != -1)
            {
                var temp;
                tempresult.eventtype = 'shot';
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName'] = _pjs.$(temp, this).text();
                tempresult.player['href'] = _pjs.$(temp, this).attr('href');

                if(text.indexOf('(assist') != -1)
                {
                    temp = td_var + ' a:nth-child(2)';
                    tempresult.assist['playerName'] = _pjs.$(temp, this).text();
                    tempresult.assist['href'] = _pjs.$(temp, this).attr('href');
                }
                
                if(text.indexOf(' ft') != -1)
                {
                    tempresult.shotdistance = text.split('from ')[1].split(' ft')[0];
                }

                if(text.indexOf('rim') != -1)
                    tempresult.type = 'layup';
                else
                    tempresult.type = 'jump-shot';

                if(text.indexOf('makes') != -1 || text.indexOf('makes') != -1)
                {
                    tempresult.result = 'made';
                    tempresult.points = text.split('makes ')[1].split('-pt')[0]
                }   
                else
                {
                    tempresult.result = 'missed';
                    tempresult.points =  text.split('misses ')[1].split('-pt')[0]
                    temp = td_var + ' a:nth-child(2)';
                    tempresult.block['playerName'] = _pjs.$(temp, this).text();
                    tempresult.block['href'] = _pjs.$(temp, this).attr('href');
                }         
            }

            else if(_pjs.$(td_var, this).text().indexOf('rebound') != -1)
            {
                var temp;
                tempresult.eventtype = 'rebound';
                tempresult.type = text.split(' rebound')[0];
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName'] = _pjs.$(temp, this).text();
                tempresult.player['href'] = _pjs.$(temp, this).attr('href');
            }

            else if(_pjs.$(td_var, this).text().indexOf('foul') != -1)
            {
                tempresult.eventtype = 'foul';
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName'] = _pjs.$(temp, this).text();
                tempresult.player['href'] = _pjs.$(temp, this).attr('href');
                temp = td_var + ' a:nth-child(2)';
                tempresult.opponent['playerName'] = _pjs.$(temp, this).text();
                tempresult.opponent['href'] = _pjs.$(temp, this).attr('href');
                tempresult.type = text.split(' foul')[0];
            }
                
            else if(_pjs.$(td_var, this).text().indexOf('Defensive three seconds') != -1)
            {
                tempresult.eventtype = 'foul';
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName'] = _pjs.$(temp, this).text();
                tempresult.player['href'] = _pjs.$(temp, this).attr('href');
                tempresult.type = 'illegal defense';
            }

            else if(_pjs.$(td_var, this).text().indexOf('timeout') != -1)
            {
                tempresult.eventtype = 'timeout';
                if(text.indexOf('official') != -1)
                    tempresult.type = 'official';
                else if(text.indexOf('full') != -1)
                    tempresult.type = 'full';
                else
                    tempresult.type = 'short';
            }

            else if(_pjs.$(td_var, this).text().indexOf('free throw') != -1)
            {
                var temp;
                tempresult.eventtype = 'free throw';
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName'] = _pjs.$(temp, this).text();
                tempresult.player['href'] = _pjs.$(temp, this).attr('href');
                if(text.indexOf('technical') != -1)
                {
                    tempresult.reason = 'technical';
                    tempresult.numfreeshot = '1';
                    tempresult.outof = '1'
                }
                else
                {
                    tempresult.reason = 'foul';
                    tempresult.numfreeshot = text.split('free throw')[1].split(' of ')[0];
                    tempresult.outof = text.split('free throw')[1].split(' of ')[1];
                }

                if(text.indexOf('makes') != -1)
                    tempresult.result = 'made';
                else
                    tempresult.result = 'missed';
            }
           
            else if(_pjs.$(td_var, this).text().indexOf('enters') != -1)
            {
                var temp;
                tempresult.eventtype = 'substitute';
                temp = td_var + ' a:nth-child(1)';
                tempresult.entered['playerName'] = _pjs.$(temp, this).text();
                tempresult.entered['href'] = _pjs.$(temp, this).attr('href');
                temp = td_var + ' a:nth-child(2)';
                tempresult.lefts['playerName'] = _pjs.$(temp, this).text();       
                tempresult.lefts['href'] = _pjs.$(temp, this).attr('href'); 
            }

            else if(_pjs.$(td_var, this).text().indexOf('Violation') != -1)
            {
                var temp;
                tempresult.eventtype = 'violation';
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName'] = _pjs.$(temp, this).text();
                tempresult.player['href'] = _pjs.$(temp, this).attr('href');
                tempresult.reason = text.split('(')[1].split(')')[0];
            }

            else if(_pjs.$(td_var, this).text().indexOf('ejected') != -1)
            {
                var temp;
                tempresult.eventtype = 'ejection';
                temp = td_var + ' a:nth-child(1)';
                tempresult.player['playerName'] = _pjs.$(temp, this).text();
                tempresult.player['href'] = _pjs.$(temp, this).attr('href');
                tempresult.reason = 'second technical';
            }
            result.push(tempresult);

        });
        
        finalresult.content['pbp'] = result;
        return finalresult;
        }
    }); 

pjs.addSuite({

    // single URL or array
    url:urls.shot_chart,
    //url : "http://www.basketball-reference.com/boxscores/shot-chart/200701260LAL.html",
    noConflict: true,
    preScrape: function() {
        _pjs.filename = window.location.href;
    },
    // single function or array, evaluated in the client
    scraper: function() {     
        var finalresult = {
            content : {},
            filename : '/home/vinit/Desktop/DR/BR/FINAL1/' + _pjs.filename.split("shot-chart/")[1].substr(0,4) + '/' + _pjs.filename.split("shot-chart/")[1] + '.json'
            };
        
        var playerMap = {};
        var result = [];
        var awayteam = _pjs.$('table.margin_top tbody tr.valign_top td:nth-child(1) table.margin_top tbody tr.valign_top td:nth-child(1) div.table_heading h2').text();
        var hometeam = _pjs.$('table.margin_top tbody tr.valign_top td:nth-child(1) table.margin_top tbody tr.valign_top td:nth-child(2) div.table_heading h2').text();
        var div_id = _pjs.$('table.nav_table.no_highlight.stats_table tbody tr:nth-child(2) td.align_center.background_yellow td:nth-child(1) a').text();
        var temp = 'table.margin_top tbody tr.valign_top td:nth-child(1) div#wrapper-'+ div_id.substring(0,3) + ' div#shots-' + div_id.substring(0,3) + ' div'

        _pjs.$(temp).each(function(){
            var tempresult = {
                quarter: '',
                time: '',
                team: awayteam,
                x: _pjs.$(this).attr('style').split('left:')[1].split('px;')[0],
                y: _pjs.$(this).attr('style').split('top:')[1].split('px;')[0],
                text: _pjs.$('span',this).attr('tip')
            };

            if(tempresult.text.indexOf(' quarter,') != -1)
                tempresult.quarter = tempresult.text.split(' quarter,')[0]; 
            else
                tempresult.quarter = (4 + parseInt(tempresult.text.split(' overtime,')[0])).toString() + "th";

            tempresult.time = tempresult.text.split(' remaining')[0].split(', ')[1];
            var key = tempresult.quarter + tempresult.time + tempresult.team;
            var coordinateMap = {'xcoor' : tempresult.x, 'ycoor' : tempresult.y};
            playerMap[key] = coordinateMap;
        });

        temp = 'table.margin_top tbody tr.valign_top td:nth-child(1) div#wrapper-'+ div_id.substring(3,6) + ' div#shots-' + div_id.substring(3,6) + ' div'
        
        _pjs.$(temp).each(function(){

            var tempresult = {
                quarter: '',
                time: '',
                team: hometeam,
                x: _pjs.$(this).attr('style').split('left:')[1].split('px;')[0],
                y: _pjs.$(this).attr('style').split('top:')[1].split('px;')[0],
                text: _pjs.$('span',this).attr('tip')
            };

            if(tempresult.text.indexOf(' quarter,') != -1)
                tempresult.quarter = tempresult.text.split(' quarter,')[0]; 
            else
                tempresult.quarter = (4 + parseInt(tempresult.text.split(' overtime,')[0])).toString() + "th";
            
            tempresult.time = tempresult.text.split(' remaining')[0].split(', ')[1];
            var key = tempresult.quarter + tempresult.time + tempresult.team;
            var coordinateMap = {'xcoor' : tempresult.x, 'ycoor' : tempresult.y};
            playerMap[key] = coordinateMap;

            //result.push(tempresult);
        });        
         
         finalresult.content['shot_chart'] = playerMap;
         return finalresult;   
        }
    }); 
    
pjs.config({ 
    // options: 'stdout', 'file' (set in config.logFile) or 'none'
    log:'file',
    logFile:'logs_scrape2008.txt',
    // options: 'json' or 'csv'
    format:'json',
    // options: 'stdout' or 'file' (set in config.outFile)
    writer:'my_itemfile',
    csvFields: ['awayteam',
                'hometeam',
                'quarter',
                'time',
                'team',
                'eventtype',
                'assist',
                'awayjumpball',
                'block',
                'entered',
                'homejumpball',
                'lefts',
                'numfreeshot',
                'opponent',
                'outof',
                'player',
                'points',
                'possession',
                'reason',
                'result',
                'steal',
                'type',
                'x',
                'y',
                'score',
                'shotdistance']
});  