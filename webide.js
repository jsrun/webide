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
         * Function to manage dependencies
         * 
         * @see https://github.com/andrehrf/dependecy
         * @param string namespace
         * @param function fn
         * @return void
         */
        _call(namespace, fn, extend){
            var _this = this;
            
            if(typeof fn == "function"){
                if(fn.toString().length > 0){
                    var dependencesFn = [], lack = [];

                    if(/.*?function\s*?\(.*?\).*?/i.test(fn.toString().split("\n")[0]))
                        var funcArgs = fn.toString().split("\n")[0].match(/.*?function\s*?\((.*?)\).*?/i)[1].split(",");
                    else if(/.*?\(.*?\)\s*?=>\s*?{.*?/i.test(fn.toString().split("\n")[0]))
                        var funcArgs = fn.toString().split("\n")[0].match(/.*?\((.*?)\)\s*?=>\s*?{.*?/i)[1].split(",");

                    if(funcArgs){
                        for(var key in funcArgs){//Fix spaces
                            if(trim(funcArgs[key]) !== "" && trim(funcArgs[key]) != undefined && trim(funcArgs[key]) != null)
                                dependencesFn[key] = trim(funcArgs[key]);
                        }

                        if(dependencesFn.length > 0){
                            var dependencesArr = [];

                            for(var key in dependencesFn){
                                if(this[dependencesFn[key]])
                                    dependencesArr.push(_this[dependencesFn[key]]);
                                else if(dependencesFn[key] == "_this")
                                    dependencesArr.push(_this);
                                else
                                    lack.push(dependencesFn[key]);
                            }

                            if(dependencesArr.length === dependencesFn.length){
                                if(extend)
                                    this[namespace] = fn.apply(this, dependencesArr);
                                else
                                    return fn.apply(this, dependencesArr);
                            }
                            else{
                                if(!pointer)
                                    pointer = 1;

                                pointer++;

                                if(pointer < 10)
                                    setTimeout((_this, name, fn, pointer) => { return _this.call.apply(_this, [name, fn, pointer]); }, 300, _this, namespace, fn, pointer);                                    
                                else
                                    console.error("Could not load module", namespace, lack);
                            }
                        }
                        else{
                            if(extend)
                                this[namespace] = fn.apply(this, null);
                            else 
                                return fn.apply(this, null);
                        }
                    }
                    else{
                        console.error("Could not load module", namespace);
                    }
                }
            }
            
            /**
             * @see http://locutus.io/php/strings/trim/
             */
            function trim(str, charlist) {
               var whitespace = [' ', '\n', '\r', '\t', '\f', '\x0b', '\xa0','\u2000', 
                                 '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', 
                                 '\u2007', '\u2008', '\u2009', '\u200a', '\u200b', '\u2028', 
                                 '\u2029', '\u3000'].join('');

               var l = 0
               var i = 0
               str += ''

               if (charlist) 
                   whitespace = (charlist + '').replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^:])/g, '$1')


               l = str.length;

               for (i = 0; i < l; i++) {
                   if (whitespace.indexOf(str.charAt(i)) === - 1) {
                       str = str.substring(i)
                       break;
                   }
               }

               l = str.length;

               for (i = l - 1; i >= 0; i--) {
                   if (whitespace.indexOf(str.charAt(i)) === - 1) {
                       str = str.substring(0, i + 1)
                       break;
                   }
               }

               return whitespace.indexOf(str.charAt(0)) === - 1 ? str : ''
            }
        },
        
        /**
         * Function to verify dependencies and incorporate function to the scope
         * 
         * @param string name
         * @param function fn
         * @return void
         */
        extend: function(namespace, fn){
            this._call(namespace, fn, true);
        },
        
        /**
         * Function to map dependencies and execute the function with the requirements
         * 
         * @param function fn
         * @param boolean rn
         * @return void
         */
        satisfy: function(namespace, fn, rn){
            return this._call(null, fn, !rn);
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
                let namespace = path.basename(path.dirname(filename)).replace(/wi.ide./img, "");
                _this.extend(namespace, require(filename));
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
                    let namespace = path.basename(path.dirname(filename)).replace(/wi.ide./img, "");
                    _this.extend(namespace, require(filename));
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
                //else throw new SystemException("Could not import '" + key + "' because it already exists");
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
            
                for(let modulesKey in _this){    
                    try{
                        if(typeof _this[modulesKey].assetsCore == "object")
                            if(typeof _this[modulesKey].assetsCore.js == "object")
                                assents = _.concat(assents, _this[modulesKey].assetsCore.js)
                    }catch(e){}
                }
                    
                assents = _.concat(assents, _this.assetsCore.js);
                let buildJS = _this.createBuild(assents, "js", false);
                res.header("Content-type", "text/javascript").send(buildJS); 
            });
                    
            this.app.get("/build.min.js", (req, res) => { 
                let assents = [];
            
                for(let modulesKey in _this){  
                    try{
                        if(typeof _this[modulesKey].assets == "object")
                            if(typeof _this[modulesKey].assets.js == "object")
                                assents = _.concat(assents, _this[modulesKey].assets.js);
                    }catch(e){}
                }
                                    
                assents = _.concat(assents, _this.assents.js);
                let buildJS = _this.createBuild(assents, "js", false);
                res.header("Content-type", "text/javascript").send(buildJS); 
            });
            
            this.app.get("/build.core.min.css", (req, res) => { 
                let assents = [];
            
                for(let modulesKey in _this){   
                    try{
                        if(typeof _this[modulesKey].assetsCore == "object")
                            if(typeof _this[modulesKey].assetsCore.css == "object")
                                assents = _.concat(assents, _this[modulesKey].assetsCore.css);
                    }catch(e){}
                }
                    
                assents = _.concat(assents, _this.assetsCore.css);                
                let buildCSS = _this.createBuild(assents, "css", false);
                res.header("Content-type", "text/css").send(buildCSS); 
            });

            this.app.get("/build.min.css", (req, res) => { 
                let assents = [];
            
                for(let modulesKey in _this){   
                    try{
                        if(typeof _this[modulesKey].assets == "object")
                            if(typeof _this[modulesKey].assets.css == "object")
                                assents = _.concat(assents, _this[modulesKey].assets.css);
                    }catch(e){}
                }
                    
                assents = _.concat(assents, _this.assents.css);                
                let buildCSS = _this.createBuild(assents, "css", false);
                res.header("Content-type", "text/css").send(buildCSS); 
            });

            this.app.get("/", (req, res) => {   
                let fs = require("fs"), ejs = require("ejs"), modulesTemplate = []; 
                                
                for(let modulesKey in _this){ 
                    try{
                        if(typeof _this[modulesKey].bootstrap == "function" && _this[modulesKey].bootstrap !== undefined)
                            _this.satisfy(modulesKey, _this[modulesKey].bootstrap);
                    }catch(e){}
                }
                                
                for(let modulesKey in _this){   
                    try{
                        if(typeof _this[modulesKey].getTemplate == "function")
                            modulesTemplate.push(_this.satisfy(modulesKey, _this[modulesKey].getTemplate, true));
                    }catch(e){}
                }
                
                for(let ideKeys in this.ide){
                    if(fs.statSync(__dirname + "/.ide/wi.ide." + ideKeys + "/template.ejs").isFile())
                        modulesTemplate.push(fs.readFileSync(__dirname + "/.ide/wi.ide." + ideKeys + "/template.ejs"));
                }

                for(let pluginsKeys in this.plugins){
                    if(fs.statSync(__dirname + "/.plugins/wi.plugins." + pluginsKeys + "/template.ejs").isFile())
                        modulesTemplate.push(fs.readFileSync(__dirname + "/.plugins/wi.plugins." + pluginsKeys + "/template.ejs"));
                }
                                    
                try{
                    _this.settings.getUser(_this, ((res.user) ? req.user._id : 0), "theme", "default", (theme, settings) => {
                        var template = ejs.render(fs.readFileSync(__dirname + "/static/index.ejs").toString(), {modules: modulesTemplate, theme: theme, __: _this.i18n.__});
                        template = ejs.render(template, {user: req.user, userSettings: JSON.stringify(settings), __: _this.i18n.__});
                        res.send(template); 
                    });  
                }catch(e){ res.status(500).send("error"); }
            });
        }
    };
};
