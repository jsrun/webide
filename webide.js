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
    async = require("async"),
    SystemException = require("./.core/wi.core.exception.js"),
    chokidar = require("chokidar"),
    glob = require('glob');

module.exports = function(){
    return {    
        /**
         * List module assets
         * @type object
         */
        assents: {css: [], js: []},
        
        /**
         * List of core modules assets
         * @type object
         */
        assetsCore: {css: [], js: []},
        
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
            var _this = this;
            
            var watcher = chokidar.watch(glob.sync(__dirname + "/.core/*/bootstrap.js")).on('all', (event, filename) => {                
                let namespace = path.basename(path.dirname(filename)).replace(/wi.core./img, "");
                _this[namespace] = require(filename);
            });
            
            chokidar.watch(glob.sync(__dirname + "/.core/*/events.js")).on('all', (event, filename) => {
                if(event == "add") _this.insertJs(filename);
            });
            
            chokidar.watch(glob.sync(__dirname + "/.core/*/style.css")).on('all', (event, filename) => {
                if(event == "add") _this.insertCss(filename);
            });
                    
            watcher.on('ready', next).on('change', next);
        },

        /**
         * Function to load ide scripts
         * 
         * @param function next
         * @return void
         */
        loadIde: function(next){             
            var _this = this;
            
            var watcher = chokidar.watch(glob.sync(__dirname + "/.ide/*/bootstrap.js")).on('all', (event, filename) => {                  
                if(event == "add"){
                    let namespace = path.basename(path.dirname(filename)).replace(/wi.ide./img, "");
                    require(filename)(_this);
                }
            });
            
            chokidar.watch(glob.sync(__dirname + "/.ide/*/events.js")).on('all', (event, filename) => {
                if(event == "add") _this.insertJs(filename);
            });
            
            chokidar.watch(glob.sync(__dirname + "/.ide/*/style.css")).on('all', (event, filename) => {
                if(event == "add") _this.insertCss(filename);
            });
                    
            watcher.on('ready', next).on('change', next);
        },
        
        /**
         * Function to load plugins scripts
         * 
         * @param function next
         * @return void
         */
        loadPlugins: function(next){            
            var _this = this;
            
            if(glob.sync(__dirname + "/.plugins/*").length > 0){
                var watcher = chokidar.watch(glob.sync(__dirname + "/.plugins/*/bootstrap.js")).on('all', (event, filename) => {  
                    if(event == "add"){
                        let namespace = path.basename(path.dirname(filename)).replace(/wi.ide./img, "");
                        require(filename)(_this);
                    }
                });

                chokidar.watch(glob.sync(__dirname + "/.plugins/*/events.js")).on('all', (event, filename) => {
                    if(event == "add") _this.insertJs(filename);
                });

                chokidar.watch(glob.sync(__dirname + "/.plugins/*/style.css")).on('all', (event, filename) => {
                    if(event == "add") _this.insertCss(filename);
                });

                watcher.on('ready', next).on('change', next);
            }
            else{
                next();
            }
        },
        
        /**
         * Function to import modules
         * 
         * @param object arr 
         * @return this
         */
        imports: function(arr){
            for(let key in arr){
                if(!this[key]) this[key] = arr[key];
                else throw new SystemException("Could not import '" + key + "' because it already exists");
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
            
            async.series([(n) => { return _this.loadCore(n) }, 
                          (n) => { return _this.loadIde(n) }, 
                          (n) => { return _this.loadPlugins(n) },
                          (n) => {
                            console.log("Check plugins");
                            /*if(_this.atom){
                                _this.atom.parsePackages(__dirname + "/.plugins", _this, n);
                                _this.atom.static(_this.app);
                            }
                            else{
                                n();
                            }*/
                            n();
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
         * Function to concatenate and minify assets files
         * 
         * @param object assents
         * @param string type (js, css)
         * @param boolean min
         * @return string
         */
        createBuild: function(assents, type, min){
            var buffer = "";
            
            for(let jsKey in assents)
                if(fs.statSync(assents[jsKey]))
                    buffer += fs.readFileSync(assents[jsKey]) + "\r\n\r\n";
            
            if(min){
                switch(type){
                    case "js":
                        let jsmin = require('jsmin').jsmin;
                        return jsmin(buffer);
                    break;
                    case "css":
                        let cssmin = require('cssmin'); 
                        return cssmin(buffer);
                    break;
                    default: return buffer; break;
                }
            }
            else{
                return buffer;
            }
        },
        
        /**
         * System startup function 
         * 
         * @param object app
         */
        boostrap: function(){
            //Login
            let _this = this, assents = {js: [], css: []};
            
        },
        
        /**
         * System startup function 
         * 
         * @param object app
         */
        boostrapDev: function(){
            let _this = this;
            
            this.app.get("/build.core.min.js", (req, res) => { 
                let assents = [];
            
                for(let modulesKey in _this)    
                    if(typeof _this[modulesKey].assetsCore == "object")
                        if(typeof _this[modulesKey].assetsCore.js == "object")
                            assents = _.concat(assents, _this[modulesKey].assetsCore.js)
                    
                assents = _.concat(assents, _this.assetsCore.js);
                let buildJS = _this.createBuild(assents, "js", false);
                res.header("Content-type", "text/javascript").send(buildJS); 
            });
                    
            this.app.get("/build.min.js", (req, res) => { 
                let assents = [];
            
                for(let modulesKey in _this)    
                    if(typeof _this[modulesKey].assets == "object")
                        if(typeof _this[modulesKey].assets.js == "object")
                            assents = _.concat(assents, _this[modulesKey].assets.js)
                    
                assents = _.concat(assents, _this.assents.js);
                let buildJS = _this.createBuild(assents, "js", false);
                res.header("Content-type", "text/javascript").send(buildJS); 
            });
            
            this.app.get("/build.core.min.css", (req, res) => { 
                let assents = [];
            
                for(let modulesKey in _this)   
                    if(typeof _this[modulesKey].assetsCore == "object")
                        if(typeof _this[modulesKey].assetsCore.css == "object")
                            assents = _.concat(assents, _this[modulesKey].assetsCore.css)
                    
                assents = _.concat(assents, _this.assetsCore.css);                
                let buildCSS = _this.createBuild(assents, "css", false);
                res.header("Content-type", "text/css").send(buildCSS); 
            });

            this.app.get("/build.min.css", (req, res) => { 
                let assents = [];
            
                for(let modulesKey in _this)   
                    if(typeof _this[modulesKey].assets == "object")
                        if(typeof _this[modulesKey].assets.css == "object")
                            assents = _.concat(assents, _this[modulesKey].assets.css)
                    
                assents = _.concat(assents, _this.assents.css);                
                let buildCSS = _this.createBuild(assents, "css", false);
                res.header("Content-type", "text/css").send(buildCSS); 
            });

            this.app.get("/", (req, res) => {   
                let fs = require("fs"), ejs = require("ejs"), params = []; 
                
                for(let modulesKey in _this)    
                    if(typeof _this[modulesKey].bootstrap == "function")
                        _this[modulesKey].bootstrap(_this);
                                
                for(let modulesKey in _this)   
                    if(typeof _this[modulesKey].getTemplate == "function")
                        params.push(_this[modulesKey].getTemplate(_this));
                
                for(let ideKeys in this.ide){
                    //try{
                        if(fs.statSync(__dirname + "/.ide/wi.ide." + ideKeys + "/wi.ide." + ideKeys + ".tpl.ejs"))
                            params.push(fs.readFileSync(__dirname + "/.ide/wi.ide." + ideKeys + "/wi.ide." + ideKeys + ".tpl.ejs"));
                    //}
                    //catch(e){}
                    
                    //New format
                    //try{
                        if(fs.statSync(__dirname + "/.ide/wi.ide." + ideKeys + "/template.ejs"))
                            params.push(fs.readFileSync(__dirname + "/.ide/wi.ide." + ideKeys + "/template.ejs"));
                    //}
                    //catch(e){}
                }

                for(let pluginsKeys in this.plugins){
                    //try{
                        if(fs.statSync(__dirname + "/.plugins/wi.plugins." + pluginsKeys + "/wi.plugins." + pluginsKeys + ".tpl.ejs"))
                            params.push(fs.readFileSync(__dirname + "/.plugins/wi.plugins." + pluginsKeys + "/wi.plugins." + pluginsKeys + ".tpl.ejs"));
                    //}
                    //catch(e){}
                    
                    //New format
                    //try{
                        if(fs.statSync(__dirname + "/.plugins/wi.plugins." + pluginsKeys + "/template.ejs"))
                            params.push(fs.readFileSync(__dirname + "/.plugins/wi.plugins." + pluginsKeys + "/template.ejs"));
                    //}
                    //catch(e){}
                }
                                
                _this.settings.getUser(_this, ((res.user) ? req.user._id : 0), "theme", "default", (theme, settings) => {
                    var template = ejs.render(fs.readFileSync(__dirname + "/static/index.ejs").toString(), {modules: params, theme: theme, __: _this.i18n.__});
                    template = ejs.render(template, {user: req.user, userSettings: JSON.stringify(settings), __: _this.i18n.__});
                    res.send(template); 
                });  
            });
        }
    };
};
