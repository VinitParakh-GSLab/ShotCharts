/*! 
 * pjscrape Copyright 2011 Nick Rabinowitz.
 * Licensed under the MIT License (see LICENSE.txt)
 */

/**
 * @overview
 * <p>Scraping harness for PhantomJS. Requires PhantomJS or PyPhantomJS v.1.3
 * </p>
 *
 * @name pjscrape.js
 * @author Nick Rabinowitz (www.nickrabinowitz.com)
 * @version 0.1
 */

var fs = require('fs');

phantom.injectJs('lib/md5.js');

function fail(msg) {
    console.log('FATAL ERROR: ' + msg);
    phantom.exit(1);
};

/**
 * @namespace
 * Root namespace for PhantomJS-side code
 * @name pjs
 */
var pjs = (function(){
    var config = {
	        delayBetweenRuns: 3000,
            timeoutInterval: 1000,
            timeoutLimit: 10000,
            log: 'stdout',
            writer: 'stdout',
            format: 'json',
            logFile: 'pjscrape_log.txt',
            outFile: 'pjscrape_out.txt' 
        };
        
    var suites = [];
        
        
    // utils
    function isFunction(f) {
        return typeof f === 'function';
    }
    function isObject(o) {
        return typeof o === 'object';
    }
    function funcify(f) {
        return isFunction(f) ? f : function() { return f };
    }
    function isArray(a) {
       // console.log('here');
        //console.log(a);
        return Array.isArray(a);
    }
    function arrify(a) {
        return isArray(a) ? a : a ? [a] : [];
    }
    function getKeys(o) {
        var keys = [];
        for (var key in o) keys.push(key);
        return keys;
    }
    function extend(obj) {
        Array.prototype.slice.call(arguments, 1).forEach(function(source) {
            for (var prop in source) {
                if (source[prop] !== void 0) obj[prop] = source[prop];
            }
        });
        return obj;
    };

    /**
     * @name pjs.loggers
     * @namespace
     * Logger namespace. You can add new loggers here; new logger classes
     * should probably extend pjs.loggers.base and redefine the 
     * <code>log</code> method.
     * @example
        // create a new logger
        pjs.loggers.myLogger = function() {
            return new pjs.loggers.base(function(msg) { 
                // do some special logging stuff
            });
        };
        // tell pjscrape to use your logger
        pjs.config({
            log: 'myLogger'
        });
     */
    var loggers = {
    
        /** 
         * @name pjs.loggers.base
         * @class Abstract base logger class
         * @private
         */
        base: function(logf) {
            var log = this;
            log.log = logf || function(msg) { console.log(msg) };
            log.msg = function(msg) { log.log('* ' + msg) };
            log.alert = function(msg) { log.log('! ' + msg) };
            log.error = function(msg) { log.log('ERROR: ' + msg) };
        },
        
        /** 
         * Log to config.logFile
         * @name pjs.loggers.file
         * @type Logger
         */
        file: function() {
            return new loggers.base(function(msg) { 
                fs.write(config.logFile, msg + "\n", 'a');
            });
        },
        
        /**
         * Disable logging
         * @name pjs.loggers.none
         * @type Logger
         */
        none: function() {
            return new loggers.base(function() {});
        }
    };
        
    /**
     * Log to STDOUT
     * @name pjs.loggers.stdout
     * @type Logger
     */
    loggers.stdout = loggers.base;

    /**
     * @name pjs.formatters
     * @namespace
     * Formatter namespace. You can add new formatters here; new formatter classes
     * should have the properties start</code>, <code>end</code>, and 
     * <code>delimiter</code>, and the method <code>format(item)</code>. You might
     * save some time by inheriting from formatters.raw or formatters.json.
     * @example
        // create a new formatter
        pjs.formatters.pipe = function() {
            var f = new pjs.formatters.raw();
            f.delimiter = '|';
            return f;
        };
        // tell pjscrape to use your formatter
        pjs.config({
            format: 'pipe'
        });
     */
    var formatters = {
        
        /** 
         * Raw formatter - just uses toString()
         * @name pjs.formatters.raw 
         * @type Formatter
         */
        raw: function() {
            var f = this;
            f.start = f.end = f.delimiter = '';
            f.format = function(item) {
                return item.toString();
            };
        },
        
        /** 
         * Format output as a JSON array
         * @name pjs.formatters.json 
         * @type Formatter
         */
        json: function() {
            var f = this;
            f.start = '[';
            f.end = ']';
            f.delimiter = ',';
            f.format = function(item) {
                return JSON.stringify(item, null, 4);
            };
        },
        
        /** 
         * CSV formatter - takes arrays or objects, fields defined by 
         * config.csvFields or auto-generated based on first item
         * @name pjs.formatters.csv 
         * @type Formatter
         */
        csv: function() {
            var f = this,
                fields = config.csvFields,
                makeRow = function(a) { return a.map(JSON.stringify).join(',') };
                

            f.delimiter = "\r\n";
            f.start = fields ? makeRow(fields) + f.delimiter : '';
            f.end = '';
            f.format = function(item) {
                if (item && typeof item == 'object') {
                    var out = '';
                    if (!fields) {
                        if (isArray(item)) {
                            fields = [];
                            for (var i=0; i<item.length; i++) fields[i] = 'Column ' + (i+1);
                        } else fields = getKeys(item);
                        out = makeRow(fields) + f.delimiter;
                    }

                    //console.log(fields);
                    // make an array out of an object if necessary
                    if (!isArray(item)) {
                        var tmp = [];
                        fields.forEach(function(field) {
                            tmp.push(item[field] || '');
                        });
                        item = tmp;
                    }
                    return out + item
                        // too long?
                        .slice(0, fields.length)
                        // too short?
                        .concat(item.length < fields.length ? 
                            new Array(fields.length - item.length) :
                            [])
                        // quote strings if necessary, etc
                        /*.map(function(v) {
                            // escape double quotes with two double quotes
                            return JSON.stringify(v).replace(/\\"/g, '""');
                        })*/
                        .join(',');
                }
            };
        }
    };

    /**
     * @name pjs.writers
     * @namespace
     * <p>Writer namespace. You can add new writers here; new writer classes
     * should probably extend pjs.writers.base and redefine the 
     * <code>write</code> method.</p>
     * <p>Items returned by scrapers will be added to the output via
     * <code>Writer.add(item)</code>, which can take any type of object. If
     * an array is provided, multipled items will be added.
     * @example
        // create a new writer
        pjs.writers.myWriter = function(log) {
            var w = new pjs.writers.base(log);
            w.write = function(s) {
                // write s to some special place
            }
            return w;
        };
        // tell pjscrape to use your writer
        pjs.config({
            writer: 'myWriter'
        });
     */
    var writers = {
        /** 
         * @name pjs.writers.base
         * @class Abstract base writer class
         * @private
         */
        base: function(log) {
            var w = this,
                count = 0,
                items = [],
                batchSize = config.batchSize,
                format = config.format || 'json',
                firstWrite = true,
                lastWrite = false;
            
            // init formatter
            var formatter = new formatters[format]();
            
            // write output
            var writeBatch = function(batch) {
                //log.msg('Writing ' + batch.length + ' items');
                w.write(
                    (firstWrite ? formatter.start : formatter.delimiter) +
                    batch.map(formatter.format).join(formatter.delimiter) +
                    (lastWrite ? formatter.end : '')
                );
                firstWrite = false;
            };
            
            /** 
             * Add an item to be written to output
             * @name pjs.writers.base#add 
             * @function
             * @param {Object|String|Array} Item to add
             */
            w.add = function(i) {
                // add to items
                if (i) {
                    i = arrify(i);
                    items = items.concat(i);
                    count += i.length;
                    // write if necessary
                    if (batchSize && items.length > batchSize) {
                        writeBatch(items.splice(0, batchSize));
                    }
                }
            };
            
            /** 
             * Finish up writing output
             * @name pjs.writers.base#finish 
             * @function
             */
            w.finish = function() {
                lastWrite = true;
                writeBatch(items);
            };
            
            /** 
             * Get the number of items written to output
             * @name pjs.writers.base#count 
             * @function
             * @return {Number}     Number of items written
             */
            w.count = function() {
                return count;
            };
            
            /** 
             * Write a string to output
             * @name pjs.writers.base#write 
             * @function
             * @param {String} s    String to write
             */
            w.write = function(s) { 
                console.log(s);
            };
        },
        
        /** 
         * Writes output to config.outFile
         * @name pjs.writers.file 
         * @type Writer
         */
        file: function(log) {

            var w = new writers.base(log);
            // clear file
            fs.write(config.outFile, '', 'w');
            // write method
            w.write = function(s) { 

                console.log(s);
                fs.write(config.outFile, s, 'a');
            };
            return w;
        },

        my_file: function(log){

            var w = new writers.base(log);
            // clear file
            fs.write(config.outFile, '', 'w');
            // write method
            w.write = function(s) {
            var all_urls = {
                boxscores: [],
                pbp: [],
                shot_chart : [],
                plus_minus : []
            };

            var p = JSON.parse(s);               
            for(var i=0;i<p.length;i++)
                {
                    if(typeof p[i].shot_chart != 'undefined')
                    {               
                        for(var j=0; j<p[i].shot_chart.length; j++)
                        {
                            all_urls['boxscores'].push(p[i].boxscores[j]);
                            all_urls['pbp'].push(p[i].pbp[j]);
                            all_urls['shot_chart'].push(p[i].shot_chart[j]);
                            all_urls['plus_minus'].push(p[i].plus_minus[j]);
                        }
                    }
                }
            
                all_urls = "var urls = " + JSON.stringify(all_urls) + ';';
                fs.write(config.outFile, all_urls, 'a');
        };
            return w;
    },
        

         my_file_espn: function(log){

            var w = new writers.base(log);
            // clear file
            fs.write(config.outFile, '', 'w');
            // write method
            w.write = function(s) {

            var all_urls = {
                pbp: [],
            };

            var p = JSON.parse(s);               
            for(var i=0;i<p.length;i++)
                {
                    if(typeof p[i].pbp != 'undefined')
                    {               
                        for(var j=0; j<p[i].pbp.length; j++)
                        {
                            all_urls['pbp'].push(p[i].pbp[j]);
                        }
                    }
                }
            
                all_urls = "var urls = " + JSON.stringify(all_urls) + ';';
                fs.write(config.outFile, all_urls, 'a');
        };
            return w;
    },

        /** 
         * Writes output to one file per item. Items may be provided
         * in the format <code>{ filename: "file.txt", content: "string" }</code>
         * if you'd like to specify the filename in the scraper. Otherwise,
         * files are written to config.outFile with serial numbering.
         * @name pjs.writers.itemfile 
         * @type Writer
         */
        itemfile: function(log) {
            var w = this,
                count = 0,
                format = config.format || 'raw',
                formatter = new formatters[format]();
            
            w.add = function(items) {
                // add to items
                if (items) {
                    items = arrify(items);

                    // write to separate files
                    items.forEach(function(item) {
                        var filename;
                        // support per-item filename syntax
                        if (item.filename && item.content) {
                            filename = item.filename;
                            item = item.content;
                        } 
                        // otherwise add a serial number to config.outFile
                        else {
                            var fileparts = config.outFile.split('.'),
                                ext = fileparts.pop();
                            filename = fileparts.join('.') + '-' + (count++) + '.' + ext;
                        }

                        var result = "time, team, quarter, score, text" + "\n";
                        item.forEach(function(item1) 
                        {
                            result = result + formatter.format(item1) + '\n';
                        });
                        fs.write(filename, result, 'a');
                        
                        count++;
                    });
                }
            };

            
            w.finish = function() {};
            
            w.count = function() {
                return count;
            };
        },


        /** 
         * Writes output to one file per item. Items may be provided
         * in the format <code>{ filename: "file.txt", content: "string" }</code>
         * if you'd like to specify the filename in the scraper. Otherwise,
         * files are written to config.outFile with serial numbering.
         * @name pjs.writers.itemfile 
         * @type Writer
         */


        my_itemfile: function(log) {
            var w = this,
                count = 0,
                format = config.format || 'raw',
                formatter = new formatters[format]();
            
            w.add = function(items) {
                // add to items
                if (items) {

                    items = arrify(items);

                    // write to separate files
                    items.forEach(function(item) {
                        var filename;
                        // support per-item filename syntax
                        if (item.filename && item.content) {
                            filename = item.filename;
                            item = item.content;
                        } 

                        // otherwise add a serial number to config.outFile
                        else {
                            var fileparts = config.outFile.split('.'),
                            ext = fileparts.pop();
                            filename = fileparts.join('.') + '-' + (count++) + '.' + ext;
                        }

                        console.log(filename);
                        if(fs.isFile(filename))
                        {
                            var file_content = JSON.parse(fs.read(filename));
                            item = JSON.stringify(item);
                            item = JSON.parse(item);

                            if(typeof file_content.plus_minus == 'undefined' && typeof item.plus_minus != 'undefined')
                            {
                                for(var key in item.plus_minus)
                                {
                                    if(key == 'quarter_0')
                                    {
                                        for(var url in file_content.boxscores)
                                        {
                                            item.plus_minus[key][url]=file_content.boxscores[url];
                                        }
                                    }
                                    else
                                    {
                                        //quarter_1, quarter_2
                                        for(var quarter in item.plus_minus[key])
                                        {
                                            if(quarter != 'team')
                                            {
                                                //each player in that quarter
                                                for(var l = 0; l < item.plus_minus[key][quarter].length; l++)
                                                {
                                                    //search for url of that player
                                                    for(var url in file_content.boxscores)
                                                    {
                                                        if(file_content.boxscores[url] == item.plus_minus[key][quarter][l])
                                                        {
                                                            var obj = {
                                                                'href' : url,
                                                                'playerName' : item.plus_minus[key][quarter][l]
                                                            }
                                                        }                                                
                                                    }
                                                    item.plus_minus[key][quarter][l] = obj;
                                                 }    
                                            }
                                                
                                        }
                                    }
                                } 
                                fs.write(filename, formatter.format(item), 'w');
                            }
                            
                            else if(typeof file_content.pbp == 'undefined' && typeof item.pbp != 'undefined' && typeof file_content.plus_minus.awayteam['quarter_1'] != 'undefined')
                            { 
                                var quarter;
                                for(var i=0; i<item.pbp.length; i++)
                                {  
                                        quarter = 'quarter_' + item.pbp[i].quarter;
                                        for(var k in item.pbp[i])
                                        {   
                                            if(k == 'awayjumpball' || k == 'homejumpball' || k ==  'possession' || k == 'player' || k == 'assist' || k == 'block' || k == 'steal' || k == 'opponent')
                                            { 
                                                //console.log(k);
                                                if(typeof item.pbp[i][k]['href'] != 'undefined')
                                                    item.pbp[i][k] = file_content.plus_minus['quarter_0'][item.pbp[i][k]['href']];
                                                else
                                                    item.pbp[i][k] = '';
                                            }

                                            else if(k == 'eventtype' && item.pbp[i][k] == 'substitute')
                                            {
                                                if(file_content.plus_minus.hometeam.team == item.pbp[i].team)
                                                {
                                                    for(var j=0; j<file_content.plus_minus.hometeam[quarter].length; j++)
                                                    {
                                                        if(file_content.plus_minus.hometeam[quarter][j]['href'] == item.pbp[i].lefts['href'])
                                                        {
                                                            file_content.plus_minus.hometeam[quarter].splice(j,1);        
                                                            
                                                            var obj = {
                                                                'href' : item.pbp[i]['entered']['href'],
                                                                'playerName': file_content.plus_minus['quarter_0'][item.pbp[i]['entered']['href']]
                                                            };

                                                            file_content.plus_minus.hometeam[quarter].push(obj);
                                                            item.pbp[i]['lefts'] = file_content.plus_minus['quarter_0'][item.pbp[i]['lefts']['href']];
                                                            item.pbp[i]['entered'] = file_content.plus_minus['quarter_0'][item.pbp[i]['entered']['href']];
                                                        }
                                                    }

                                                }
                                                else
                                                {
                                                    for(var j=0; j<file_content.plus_minus.awayteam[quarter].length; j++)
                                                    {
                                                        if(file_content.plus_minus.awayteam[quarter][j]['href'] == item.pbp[i].lefts['href'])
                                                        {
                                                            file_content.plus_minus.awayteam[quarter].splice(j,1);   
                                                            var obj = {
                                                                'href' : item.pbp[i]['entered']['href'],
                                                                'playerName' : file_content.plus_minus['quarter_0'][item.pbp[i]['entered']['href']]
                                                            };   

                                                            file_content.plus_minus.awayteam[quarter].push(obj);
                                                            item.pbp[i]['lefts'] = file_content.plus_minus['quarter_0'][item.pbp[i]['lefts']['href']];
                                                            item.pbp[i]['entered'] = file_content.plus_minus['quarter_0'][item.pbp[i]['entered']['href']];
                                                        }
                                                    }
                                                }
                                            }

                                            if (typeof item.pbp[i][k] == 'object' && typeof item.pbp[i][k]['href'] == 'undefined' && k != 'hometeam' && k != 'awayteam')
                                                item.pbp[i][k] = '';
                                        }
                                            
                                        for(var j=0; j<file_content.plus_minus.hometeam[quarter].length;j++)
                                        {
                                            item.pbp[i].hometeam.push(file_content.plus_minus.hometeam[quarter][j]['playerName']);
                                        }
                                        for(var j=0; j<file_content.plus_minus.awayteam[quarter].length;j++)
                                        {
                                            item.pbp[i].awayteam.push(file_content.plus_minus.awayteam[quarter][j]['playerName']);
                                        }
                                          
                                } 
                                fs.write(filename, formatter.format(item), 'w');
                            }

                            else if(typeof file_content.shot_chart == 'undefined' && typeof item.shot_chart != 'undefined' && typeof file_content.pbp != 'undefined') 
                            {
                                   var quarter = '';
                                   for(var i=0; i<file_content.pbp.length;i++)
                                   {
                                        if(file_content.pbp[i].eventtype == 'shot')
                                        {
                                            if(file_content.pbp[i].quarter == 1)
                                                quarter = '1st';
                                            else if(file_content.pbp[i].quarter == 2)
                                                quarter = '2nd';
                                            else if(file_content.pbp[i].quarter == 3)
                                                quarter = '3rd';
                                            else
                                                quarter = file_content.pbp[i].quarter + 'th';

                                            var key = quarter + file_content.pbp[i].time + file_content.pbp[i].team;
                                            var temp = item.shot_chart[key];

                                            if(typeof temp != 'undefined')
                                            {
                                                file_content.pbp[i].x = temp.xcoor;
                                                file_content.pbp[i].y = temp.ycoor;
                                            }

                                        }
                                   }
                                   
                                   format = 'csv';
                                   filename = filename.split(".json")[0] + '.csv';
                                   var formatter1 = new formatters[format]();
                                   var result = "a1, a2, a3, a4, a5, h1, h2, h3, h4, h5, quarter, time, team, eventtype, assist, awayjumpball,"
                                               + " block, entered, homejumpball, left, numfreeshot, opponent, outof,"
                                               + " player, points, possession, reason, result, steal, type, x, y, score, shotdistance" + '\n'
                                   
                                    file_content.pbp.forEach(function(item) 
                                    {
                                        result = result + formatter1.format(item) + '\n';
                                    });

                                   fs.write(filename, result, 'a');
                            }
                        }
                        else
                        {
                            fs.write(filename, formatter.format(item), 'w');
                        }
                        count++;
                    });
                }
            };

            w.finish = function() {};  
            w.count = function() {
                return count;
            };
        },
    };
        
    /**
     * Write output to STDOUT
     * @name pjs.writers.stdout
     * @type Writer
     */
    writers.stdout = writers.base;
    
    /**
     * @name pjs.hashFunctions
     * @namespace
     * Hash function namespace. You can add new hash functions here; hash functions
     * should take an item and return a unique (or unique-enough) string. 
     * @example
        // create a new hash function
        pjs.hashFunctions.myHash = function(item) {
            return item.mySpecialUID;
        };
        // tell pjscrape to ignore dupes
        pjs.config({
            ignoreDuplicates: true
        });
        // tell pjscrape to use your hash function
        pjs.addScraper({
            hashFunction: 'myHash',
            // etc
        });
     */
    var hashFunctions = {
        /** UID hash - assumes item.id; falls back on md5
         * @name pjs.hashFunctions.id
         * @type HashFunction
         */
        id: function(item) {
            return ('id' in item) ? item.id : hashFunctions.md5(item);
        },
        /** md5 hash - collisions are possible
         * @name pjs.hashFunctions.md5
         * @type HashFunction
         */
        md5: function(item) {
            return md5(JSON.stringify(item));
        }
    };
     

    // suite runner
    var runner = (function() {
        var visited = {},
            itemHashes = {},
            log, 
            writer;
        
        /**
         * @class
         * Singleton: Manage multiple suites
         * @private
         */
        var SuiteManager = new function() {
            var mgr = this,
                complete,
                suiteq = [];
                              
            // create a single WebPage object for reuse
            var page = require('webpage').create({
                // set up console output
                onConsoleMessage: function(msg, line, id) {
                    // kill initialization message
                    if (msg.indexOf('___') === 0) return;
                    id = id || 'injected code';
                    if (line) msg += ' (' + id + ' line ' + line + ')';
                    //log.msg('CLIENT: ' + msg);
                },
                onAlert: function(msg) { log.alert('CLIENT: ' + msg) }
            });

            // add waitFor method
            page.waitFor = function(test, callback) {
                // check for short-circuit
                if (this.evaluate(test)) {
                    callback(page);
                } else {
                    // poll until timeout or success
                    var elapsed = 0,
                        timeoutId = window.setInterval(function() {
                            if (page.evaluate(test) || elapsed > config.timeoutLimit) {
                                if (elapsed > config.timeoutLimit) {
                                    //log.alert('Timeout after ' + ~~(elapsed / 1000) + ' seconds');
                                }
                                window.clearInterval(timeoutId);
                                callback(page);
                            } else {
                                elapsed += config.timeoutInterval;
                            }
                        }, config.timeoutInterval);
                }
            };

            mgr.getPage = function() {           
                return page;
            };
            
            // set the completion callback
            mgr.setComplete = function(cb) {
                complete = cb;
            };
            
            // add a ScraperSuite
            mgr.add = function(suite) {
                suiteq.push(suite);
            };
            
            // run the next ScraperSuite in the queue
            mgr.runNext = function() {
                var suite = suiteq.shift();
                if (suite) suite.run();
                else complete();
            };
        }();
        
        /**
         * @class
         * Scraper suite class - represents a set of urls to scrape
         * @private
         * @param {String} title        Title for verbose output
         * @param {String[]} urls       Urls to scrape
         * @param {Object} opts         Configuration object
         */
        var ScraperSuite = function(title, urls, opts) {
            var s = this,
                truef = function() { return true };
            // set up options
            s.title = title;
            s.urls = urls;
            s.opts = extend({
                ready: function() { return _pjs.ready; },
                scrapable: truef,
                preScrape: truef,
                hashFunction: hashFunctions.id
            }, opts);
            // deal with potential arrays and syntax variants
            s.opts.loadScript = arrify(opts.loadScripts || opts.loadScript);
            s.opts.scrapers = arrify(opts.scrapers || opts.scraper);
            // set up completion callback
            s.complete = function() {
                log.msg(s.title + " complete");
                SuiteManager.runNext();
            };
            s.depth = 0;
        }
        
        ScraperSuite.prototype = {
        
            /**
             * Add an item, checking for duplicates as necessary
             * @param {Object|Array} items      Item(s) to add
             * @private
             */
            addItem: function(items) {
                var s = this;
                if (items && config.ignoreDuplicates) {
                    // ensure array
                    items = arrify(items);
                    items = items.filter(function(item) {
                        var hash = s.opts.hashFunction(item);
                        if (!itemHashes[hash]) {
                            // hash miss - new item
                            itemHashes[hash] = true;
                            return true;
                        } else {
                            // hash hit - likely duplicate
                            // Could do a second-layer check against the actual object,
                            // but that requires retaining items in memory - skip for now
                            return false;
                        }
                    });
                }
                writer.add(items);
            },
            
            /**
             * Run the suite, scraping each url
             * @private
             */
            run: function() {
                var s = this,
                    scrapers = s.opts.scrapers,
                    i = 0,
                    // get base URL for avoiding repeat visits and recursion loops
                    baseUrl = function(url) {
                        return s.opts.newHashNewPage ? url.split('#')[0] : url;
                    },
                    // completion callback
                    complete = function(page) {
                        // recurse if necessary
                        if (page && s.opts.moreUrls) {
                            // allow selector-only spiders
                            if (typeof s.opts.moreUrls == 'string') {
                                s.opts.moreUrls = new Function(
                                    "return _pjs.getAnchorUrls('" + s.opts.moreUrls + "');"
                                );
                            }
                            // look for more urls on this page
                            var moreUrls = page.evaluate(s.opts.moreUrls);
                            if (moreUrls && (!s.opts.maxDepth || s.depth < s.opts.maxDepth)) {
                                if (moreUrls.length) {
                                    //log.msg('Found ' + moreUrls.length + ' additional urls to scrape');
                                    // make a new sub-suite
                                    var ss = new ScraperSuite(s.title + '-sub' + i++, moreUrls, s.opts);
                                    ss.depth = s.depth + 1;
                                    SuiteManager.add(ss);
                                }
                            }
                        }                
                        runNext();
                    },
                    runCounter = 0;
                // run each
                function runNext() {
                    if (runCounter < s.urls.length) {
                        url = baseUrl(s.urls[runCounter++]);
                        // avoid repeat visits
                        if (!config.allowRepeatUrls && url in visited) {
                            runNext();
                        } else {
                            // scrape this url
                            //s.scrape(url, scrapers, complete);
                            window.setTimeout(function() {
                		      s.scrape(url, scrapers, complete);

              		        },config.delayBetweenRuns);
                        }
                    } else {
                        s.complete();
                    }
                }

                //log.msg(s.title + " starting");
                runNext();
            },
            
            /**
             * Scrape a single page.
             * @param {String} url          Url of page to scrape
             * @param {Function} scrapePage Function to scrape page with
             * @param {Function} complete   Callback function to run when complete
             * @private
             */
            scrape: function(url, scrapers, complete) {
                var suite = this,
                    opts = suite.opts,
                    page = SuiteManager.getPage(); 
                            /*require('webpage').create({
                            // set up console output
                            onConsoleMessage: function(msg, line, id) {
                            // kill initialization message
                            if (msg.indexOf('___') === 0) return;
                                id = id || 'injected code';
                            if (line) msg += ' (' + id + ' line ' + line + ')';
                                //log.msg('CLIENT: ' + msg);
                            },
                            onAlert: function(msg) { log.alert('CLIENT: ' + msg) }
                    });//*/ 
                
                /*            
                page.waitFor = function(test, callback) {

                // check for short-circuit
                if (this.evaluate(test)) {
                    callback(page);
                } else {
                    // poll until timeout or success
                    var elapsed = 0,
                        timeoutId = window.setInterval(function() {
                            console.log(page.evaluate(test));
                            console.log(config.timeoutLimit);
                            if (page.evaluate(test) || elapsed > config.timeoutLimit) {
                                if (elapsed > config.timeoutLimit) {
                                    console.log('Timeout after ' + ~~(elapsed / 1000) + ' seconds');
                                }
                                console.log('here1');
                                window.clearInterval(timeoutId);
                                callback(page);
                            } else {
                                console.log('here');
                                elapsed += config.timeoutInterval;
                            }
                        }, config.timeoutInterval);
                }
             };*/

            page.onResourceReceived = function(res) {
                    if (res.stage == 'end' && res.url == url) {
                        page.resource = res;
                    }
                };

            // run the scrape
            page.open(url, function(status) {

                    //console.log(page);
                    //page.settings.loadImages = false;
                    // check for load errors
                    if (status != "success") {
                        log.error('Page did not load (status=' + status + '): ' + url);
                        complete(false);
                    }
                    // look for 4xx or 5xx status codes
                    var statusCodeStart = String(page.resource.status).charAt(0);
                    if (statusCodeStart == '4' || statusCodeStart == '5') {
                        if (page.resource.status == 404) {
                            log.error('Page not found: ' + url);
                        } else {
                            log.error('Page error code ' + page.resource.status + ' on ' + url);
                        }
                        complete(false);
                    }
                    // mark as visited
                    visited[url] = true;
                    log.msg('Scraping ' + url);
                    // load jQuery
                    page.injectJs('client/jquery.js');
                    page.evaluate(function() { 
                        window._pjs$ = jQuery.noConflict(true); 
                    });
                    // load pjscrape client-side code
                    page.injectJs('client/pjscrape_client.js');
                    // reset the global jQuery vars
                    if (!opts.noConflict) {
                        page.evaluate(function() {
                            window.$ = window.jQuery = window._pjs$; 
                        });
                    }
                    // run scraper(s)
                    
                    page.waitFor(opts.ready, function(page) {
                        if (page.evaluate(opts.scrapable)) {
                            // load script(s) if necessary
                            if (opts.loadScript) {
                                opts.loadScript.forEach(function(script) {
                                    page.injectJs(script);
                                })
                            }
                            // run prescrape
                            page.evaluate(opts.preScrape);
                            // run each scraper and send any results to writer
                            if (scrapers && scrapers.length) {
                                // set up callback manager
                                var i = 0;
                                function checkComplete() {
                                    if (++i == scrapers.length) {
                                        complete(page);
                                    }
                                }

                                // run all scrapers
                                scrapers.forEach(function(scraper) {
                                    if (isFunction(scraper)) {
                                        // standard scraper
                                        suite.addItem(page.evaluate(scraper));
                                        checkComplete();
                                    } else if (typeof scraper == 'string') {
                                        // selector-only scraper
                                        suite.addItem(page.evaluate(new Function(
                                            "return _pjs.getText('" + scraper + "');"
                                        )));
                                        checkComplete();
                                    } else if (scraper.scraper) {
                                        // wrapped scraper, more options (just async now)
                                        if (scraper.async) {
                                            // start the scrape
                                            page.evaluate(scraper.scraper);
                                            // wait for the scraper to return items
                                            page.waitFor(
                                                function() {
                                                    return _pjs.items !== undefined 
                                                },
                                                function() {
                                                    suite.addItem(page.evaluate(function() {
                                                        return _pjs.items;
                                                    }));
                                                    checkComplete();
                                                }
                                            );
                                        }
                                    }
                                });
                            }
                        } else {
                            complete(page);
                        }
                        //page.close();
                    });
                });
            }
        };
        
        /**
         * Run the set of configured scraper suites.
         * @name pjs.init
         */
        function init() {
            // check requirements
            if (!suites.length) fail('No suites configured');
            if (!(config.log in loggers)) fail('Could not find logger: "' + config.log + '"');
            if (!(config.writer in writers)) fail('Could not find writer "' + config.writer + '"');
            
            // init logger
            log = new loggers[config.log]();
            // init writer
            writer = new writers[config.writer](log);
            
            // init suite manager
            SuiteManager.setComplete(function() {
                // scrape complete
                writer.finish();
                log.msg('Saved ' + writer.count() + ' items');
                phantom.exit();
            });
            // make all suitesSuiteMa
            suites.forEach(function(suite, i) {
                SuiteManager.add(new ScraperSuite(
                    suite.title || "Suite " + i, 
                    arrify(suite.url || suite.urls),
                    suite
                ));
            });
            // start the suite manager
            SuiteManager.runNext();
        }
        
        return {
            init: init
        }
    }());

    // expose namespaces and API functions
    return {
        loggers: loggers,
        formatters: formatters,
        writers: writers,
        hashFunctions: hashFunctions,
        init: runner.init,

        /**
         * Set one or more config variables, applying to all suites
         * @name pjs.config
         * @param {String|Object} key   Either a key to set or an object with
         *                              multiple values to set
         * @param {mixed} [val]         Value to set if using config(key, val) syntax
         */
        config: function(key, val) {
            if (!key) {
                return config;
            } else if (typeof key == 'object') {
                extend(config, key);
            } else if (val) {
                config[key] = val;
            }
        },

        /**
         * Add one or more scraper suites to be run.
         * @name pjs.addSuite
         * @param {Object} suite    Scraper suite configuration object
         * @param {Object} [...]    More suite configuration objects
         */
        addSuite: function() { 
            suites = Array.prototype.concat.apply(suites, arguments);
        },

        /**
         * Shorthand function to add a simple scraper suite.
         * @name pjs.addScraper
         * @param {String|String[]} url     URL or array of URLs to scrape
         * @param {Function|Function[]}     Scraper function or array of scraper functions
         */
        addScraper: function(url, scraper) {
            suites.push({url:url, scraper:scraper});
        }
    };
}());

 
// make sure we have a config file
if (!phantom.args.length) {
    // die
    console.log('Usage: pjscrape.js <configfile.js> ...');
    phantom.exit();
} else {
    // load the config file(s)
    phantom.args.forEach(function(configFile) {
        if (!phantom.injectJs(configFile)) {
            fail('Config file not found: ' + configFile);
        }
    });
}
// start the scrape
pjs.init();

