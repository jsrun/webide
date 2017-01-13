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
            
            async.series([(n) => { return _this.loadCore(n) }, 
                          (n) => { return _this.loadIde(n) }, 
                          (n) => { return _this.loadPlugins(n) },
                          (n) => { return _this.atom.parsePackages(__dirname + "/../.plugins", _this, n); }], cb); 
                      
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
            let assents = {css: [], js: []};
            
            //Modules loading
            for(let modulesKey in this){    
                if(typeof this[modulesKey].bootstrap == "function")
                    this[modulesKey].bootstrap(this);

                if(typeof this[modulesKey].assets == "object"){
                    if(typeof this[modulesKey].assets.css == "object")
                        assents.css = _.concat(assents.css, this[modulesKey].assets.css)

                    if(typeof this[modulesKey].assets.js == "object")
                        assents.js = _.concat(assents.js, this[modulesKey].assets.js)
                }
            }
            
            //IDE
            assents.js = _.concat(assents.js, this.assents.js);
            assents.css = _.concat(assents.css, this.assents.css);

            //Login
            let _this = this;
            
            /*function isAuthenticated(req, res, next){
                if(req.isAuthenticated())
                    next();
                else
                    res.redirect("/login");  
            }

            this.passport.serializeUser(function(user, done) {
                done(null, user._id);
            });

            this.passport.deserializeUser(function(id, done) {    
                _this.mongodb.collection("users").findById(id, function(err, user){
                    if(!err) done(null, user);             
                    else done(err, null)  
                })
            });

            this.passport.use('local-login', new LocalStrategy((user, password, done) => {
                _this.mongodb.collection("users").findOne({$or: [{user: user, pass: md5(password)}, {email: user, pass: md5(password)}]}, {user: 1, profile: 1, email: 1}, function(err, user){
                    if (err) return done(err); 
                    if (!user) return done(null, false);
                    else return done(err, user);
                });
            }));

            this.app.get("/login", (req, res) => { 
                if(req.isAuthenticated())
                    res.redirect("/")
                else
                    res.render("login", {message: req.flash('error')}); 
            });

            this.app.post('/login', this.passport.authenticate('local-login', {
                successRedirect : '/', 
                failureRedirect : '/login',
                failureFlash : this.i18n.__('Username or password is invalid.'),
            }));

            this.app.get("/logout", (req, res) => { 
                req.logout();
                res.redirect("/login");
            });
            
            //OAuth Github
            this.passport.use(new GitHubStrategy({clientID: this.app_settings.oauth.github.clientID, clientSecret: this.app_settings.oauth.github.clientSecret}, (accessToken, refreshToken, profile, cb) => {      
                _this.mongodb.collection("users").findAndModify({_id: profile.id}, [], {$set: profile}, {upsert: true}, (err, user) => {
                    cb(err, user.value);
                });
            }));

            this.app.get('/auth/github', this.passport.authenticate('github')); 
            this.app.get('/auth/github/callback', this.passport.authenticate('github', {
                successRedirect : '/', 
                failureRedirect: '/loginfaild', 
                failureFlash : this.i18n.__('Username or password is invalid.')
            }));*/

            //Index                        
            this.app.get("/build.min.js", (req, res) => { 
                let buildJS = "";

                for(let jsKey in assents.js)
                    if(fs.statSync(assents.js[jsKey]))
                        buildJS += fs.readFileSync(assents.js[jsKey]) + "\r\n\r\n";

                let jsmin = require('jsmin').jsmin; 
                //res.header("Content-type", "text/javascript").send(jsmin(buildJS));
                res.header("Content-type", "text/javascript").send(buildJS); 
            });

            this.app.get("/build.min.css", (req, res) => { 
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
                
                for(let modulesKey in this){    
                    if(typeof this[modulesKey].getTemplate == "function")
                        params.push(this[modulesKey].getTemplate(this));
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
                
                var template = ejs.render(fs.readFileSync(__dirname + "/../public/index.ejs").toString(), {modules: params, __: _this.i18n.__});
                template = ejs.render(template, {user: req.user, __: _this.i18n.__});

                res.send(template); 
            });
        }
    };
};
