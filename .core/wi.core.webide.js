/**
 *  __          __  _    _____ _____  ______ 
 *  \ \        / / | |  |_   _|  __ \|  ____|
 *   \ \  /\  / /__| |__  | | | |  | | |__   
 *    \ \/  \/ / _ \ '_ \ | | | |  | |  __|  
 *     \  /\  /  __/ |_) || |_| |__| | |____ 
 *      \/  \/ \___|_.__/_____|_____/|______|
 *                                                                            
 *  @author André Ferreira <andrehrf@gmail.com>
 *  @license MIT
 */

"use strict";

let fs = require("fs"),
    path = require("path"),
    _ = require("lodash"),
    glob = require("glob"),
    async = require("async"),
    LocalStrategy = require("passport-local"),
    GitHubStrategy = require('passport-github').Strategy,
    md5 = require("md5"),
    SystemException = require("./wi.core.exception.js"),
    chokidar = require("chokidar");

module.exports = function(){
    return {    
        /**
         * Namespace
         * @type string
         */
        namespace: "core.webide",

        /**
         * List module assets
         * @type object
         */
        assents: {css: [], js: []},
        
        /**
         * List of plugins 
         * @type array
         */
        pluginsPackages: [],
        
        /**
         * Function to call modules
         * 
         * @param function fn
         * @param object args
         * @return object
         */
        apply: function(fn, args){
            args.push(this);
            return fn.apply(fn, args);
        },

        /**
         * Function to load core scripts
         * 
         * @param function next
         * @return void
         */
        loadCore: function(next){
            glob("./.core/wi.core.*/wi.core.*.module.js", (err, filesSystem) => {          
                for(let filename in filesSystem){
                    chokidar.watch(filesSystem[filename]).on('all', (event, path) => {
                        if(event == "change") console.log("reloaded " + path);
                        let namespace = path.match(/^.*?wi\.core\..*?[\|\/]wi\.core\.(.*?)\.module\.js$/)[1];
                        this[namespace] = require(path.replace(".core", "."));
                    });
                }

                if(typeof next == "function")
                    next();
            });
        },

        /**
         * Function to load ide scripts
         * 
         * @param function next
         * @return void
         */
        loadIde: function(next){     
            glob("./.ide/wi.ide.*/wi.ide.*.module.js", (err, filesIde) => {
                for(let filename in filesIde){
                    let namespace = filesIde[filename].match(/^.*?wi.ide.*?[\|\/]wi\.ide\.(.*?)\.module\.js$/)[1];

                    if(!this["ide"])
                        this["ide"] = {};
                    
                    this["ide"][namespace] = require("." + filesIde[filename]);

                    if(typeof this["ide"][namespace] == "function"){
                        chokidar.watch(filesIde[filename]).on('all', (event, path) => {
                            if(event == "change") console.log("reloaded " + path);
                            this["ide"][namespace](this);
                        });
                    }

                    try{
                        if(fs.statSync(path.dirname(filesIde[filename]) + "/wi.ide." + namespace + ".events.js"))
                            this.insertJs(path.dirname(filesIde[filename]) + "/wi.ide." + namespace + ".events.js");
                    }
                    catch(e){}

                    try{
                        if(fs.statSync(path.dirname(filesIde[filename]) + "/wi.ide." + namespace + ".style.css"))
                            this.insertCss(path.dirname(filesIde[filename]) + "/wi.ide." + namespace + ".style.css");
                    }
                    catch(e){}
                }

                if(typeof next == "function")
                    next();
            });
        },
        
        /**
         * Function to load plugins scripts
         * 
         * @param function next
         * @return void
         */
        loadPlugins: function(next){
            glob("./.plugins/wi.plugins.*/wi.plugins.*.module.js", (err, filesPlugins) => {          
                for(let filename in filesPlugins){
                    let namespace = filesPlugins[filename].match(/^.*?wi\.plugins\..*?[\|\/]wi\.plugins\.(.*?)\.module\.js$/)[1];
                    
                    if(!this["plugins"])
                        this["plugins"] = {};
                    
                    this["plugins"][namespace] = require("." + filesPlugins[filename]);
                    this.pluginsPackages.push(require("." + path.dirname(filesPlugins[filename]) + "/package.json"));
                    
                    if(typeof this["plugins"][namespace] == "function"){
                        chokidar.watch(filesPlugins[filename]).on('all', (event, path) => {
                            if(event == "change") console.log("reloaded " + path);
                            this["plugins"][namespace](this);
                        });
                    }
                    
                    try{
                        if(fs.statSync(path.dirname(filesPlugins[filename]) + "/wi.plugins." + namespace + ".events.js"))
                            this.insertJs(path.dirname(filesPlugins[filename]) + "/wi.plugins." + namespace + ".events.js");
                    }
                    catch(e){}

                    try{
                        if(fs.statSync(path.dirname(filesPlugins[filename]) + "/wi.plugins." + namespace + ".style.css"))
                            this.insertCss(path.dirname(filesPlugins[filename]) + "/wi.plugins." + namespace + ".style.css");
                    }
                    catch(e){}
                }

                if(typeof next == "function")
                    next();
            });
        },
        
        /**
         * Function to import modules
         * 
         * @param object arr 
         * @return this
         */
        imports: function(arr){
            for(let key in arr){
                if(!this[key])
                    this[key] = arr[key];
                else
                    throw new SystemException("Could not import '" + key + "' because it already exists");
            }   
            
            return this;
        },

        /**
         * Loading modules
         * 
         * @param object args
         * @param function cb
         * @return this
         */
        load: function(cb){  
            let _this = this;
            
            async.series([  (n) => { return _this.loadCore(n) }, 
                            (n) => { return _this.loadIde(n) }, 
                            (n) => { return _this.loadPlugins(n) },
                            (n) => {
                                if(_this.atom){
                                    _this.atom.parsePackages(__dirname + "/../.plugins", _this, n);
                                    _this.atom.static(_this.app);
                                }
                                else{
                                    n();
                                }
                            }], cb); 
                      
            return this;
        },

        /**
         * Function to insert javascript to build
         * 
         * @param string filaname
         */
        insertJs: function(filaname){
            this.assents.js.push(filaname);
        },

        /**
         * Function to insert style to build
         * 
         * @param string filaname
         */
        insertCss: function(filaname){
            this.assents.css.push(filaname);
        },
        
        /**
         * System startup function 
         * 
         * @param object app
         */
        boostrap: function(){
            //Login
            let _this = this;
                    
            let assents = {js: [], css: []};
            
            //Modules loading
            for(let modulesKey in _this){    
                if(typeof _this[modulesKey].assets == "object"){
                    if(typeof _this[modulesKey].assets.js == "object")
                        assents.js = _.concat(assents.js, _this[modulesKey].assets.js)
                    if(typeof _this[modulesKey].assets.css == "object")
                            assents.css = _.concat(assents.css, _this[modulesKey].assets.css)
                }
            }

            assents.js = _.concat(assents.js, _this.assents.js);
            assents.css = _.concat(assents.css, _this.assents.css);

            let buildJS = "";
            for(let jsKey in assents.js)
                if(fs.statSync(assents.js[jsKey]))
                    buildJS += fs.readFileSync(assents.js[jsKey]) + "\r\n\r\n";

            let jsmin = require('jsmin').jsmin; 
            fs.writeFileSync(__dirname + "/../static/build.min.js", buildJS);
            
            let buildCSS = "";
            for(let cssKey in assents.css)
                if(fs.statSync(assents.css[cssKey]))
                    buildCSS += fs.readFileSync(assents.css[cssKey]) + "\r\n\r\n";

            let cssmin = require('cssmin'); 
            fs.writeFileSync(__dirname + "/../static/build.min.css", buildCSS);

            this.app.get("/", (req, res) => {   
                let fs = require("fs"), ejs = require("ejs"), params = []; 
                
                for(let modulesKey in _this){    
                    if(typeof _this[modulesKey].bootstrap == "function")
                        _this[modulesKey].bootstrap(_this, req);
                }
                
                for(let modulesKey in _this){    
                    if(typeof _this[modulesKey].getTemplate == "function")
                        params.push(_this[modulesKey].getTemplate(_this, req));
                }

                for(let ideKeys in this.ide){
                    try{
                        if(fs.statSync(__dirname + "/../.ide/wi.ide." + ideKeys + "/wi.ide." + ideKeys + ".tpl.ejs"))
                            params.push(fs.readFileSync(__dirname + "/../.ide/wi.ide." + ideKeys + "/wi.ide." + ideKeys + ".tpl.ejs"));
                    }
                    catch(e){}
                }

                for(let pluginsKeys in this.plugins){
                    try{
                        if(fs.statSync(__dirname + "/../.plugins/wi.plugins." + pluginsKeys + "/wi.plugins." + pluginsKeys + ".tpl.ejs"))
                            params.push(fs.readFileSync(__dirname + "/../.plugins/wi.plugins." + pluginsKeys + "/wi.plugins." + pluginsKeys + ".tpl.ejs"));
                    }
                    catch(e){}
                }
                                
                _this.settings.getUser(_this, ((res.user) ? req.user._id : 0), "theme", "default", (theme, settings) => {
                    var template = ejs.render(fs.readFileSync(__dirname + "/../public/index.ejs").toString(), {modules: params, theme: theme, __: _this.i18n.__});
                    template = ejs.render(template, {user: req.user, userSettings: JSON.stringify(settings), __: _this.i18n.__});
                    res.send(template); 
                });  
            });
        },
        
        /**
         * System startup function 
         * 
         * @param object app
         */
        boostrapDev: function(){
            //Login
            let _this = this;
                    
            this.app.get("/build.min.js", (req, res) => { 
                let assents = {js: []};
            
                //Modules loading
                for(let modulesKey in _this){    
                    if(typeof _this[modulesKey].assets == "object"){
                        if(typeof _this[modulesKey].assets.js == "object")
                            assents.js = _.concat(assents.js, _this[modulesKey].assets.js)
                    }
                }

                assents.js = _.concat(assents.js, _this.assents.js);
            
                let buildJS = "";

                for(let jsKey in assents.js)
                    if(fs.statSync(assents.js[jsKey]))
                        buildJS += fs.readFileSync(assents.js[jsKey]) + "\r\n\r\n";

                let jsmin = require('jsmin').jsmin; 
                //res.header("Content-type", "text/javascript").send(jsmin(buildJS));
                res.header("Content-type", "text/javascript").send(buildJS); 
            });

            this.app.get("/build.min.css", (req, res) => { 
                let assents = {css: []};
            
                //Modules loading
                for(let modulesKey in _this){    
                    if(typeof _this[modulesKey].assets == "object"){
                        if(typeof _this[modulesKey].assets.css == "object")
                            assents.css = _.concat(assents.css, _this[modulesKey].assets.css)
                    }
                }

                //IDE
                assents.css = _.concat(assents.css, _this.assents.css);
                
                let buildCSS = "";

                for(let cssKey in assents.css)
                    if(fs.statSync(assents.css[cssKey]))
                        buildCSS += fs.readFileSync(assents.css[cssKey]) + "\r\n\r\n";

                let cssmin = require('cssmin'); 
                //res.header("Content-type", "text/css").send(cssmin(buildCSS)); 
                res.header("Content-type", "text/css").send(buildCSS); 
            });

            this.app.get("/", (req, res) => {   
                let fs = require("fs"), ejs = require("ejs"), params = []; 
                
                for(let modulesKey in _this){    
                    if(typeof _this[modulesKey].bootstrap == "function")
                        _this[modulesKey].bootstrap(_this);
                }
                
                for(let modulesKey in _this){    
                    if(typeof _this[modulesKey].getTemplate == "function")
                        params.push(_this[modulesKey].getTemplate(_this));
                }

                for(let ideKeys in this.ide){
                    try{
                        if(fs.statSync(__dirname + "/../.ide/wi.ide." + ideKeys + "/wi.ide." + ideKeys + ".tpl.ejs"))
                            params.push(fs.readFileSync(__dirname + "/../.ide/wi.ide." + ideKeys + "/wi.ide." + ideKeys + ".tpl.ejs"));
                    }
                    catch(e){}
                }

                for(let pluginsKeys in this.plugins){
                    try{
                        if(fs.statSync(__dirname + "/../.plugins/wi.plugins." + pluginsKeys + "/wi.plugins." + pluginsKeys + ".tpl.ejs"))
                            params.push(fs.readFileSync(__dirname + "/../.plugins/wi.plugins." + pluginsKeys + "/wi.plugins." + pluginsKeys + ".tpl.ejs"));
                    }
                    catch(e){}
                }
                                
                _this.settings.getUser(_this, ((res.user) ? req.user._id : 0), "theme", "default", (theme, settings) => {
                    var template = ejs.render(fs.readFileSync(__dirname + "/../static/index.ejs").toString(), {modules: params, theme: theme, __: _this.i18n.__});
                    template = ejs.render(template, {user: req.user, userSettings: JSON.stringify(settings), __: _this.i18n.__});
                    res.send(template); 
                });  
            });
        }
    };
};
