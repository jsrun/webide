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
    cluster = require("cluster"),
    app = require("organized"),
    env = process.env.NODE_ENV || "dev";

/*if(cluster.isMaster){//Create cluster
    const cpus = require('os').cpus().length; 

    for(var i = 0; i < cpus; i++)
        cluster.fork();

    cluster.on('exit', (worker) => { cluster.fork(); }); 
}
else{  */
    app.config({   
        modules: {
            settings: `${__dirname}/settings.json`,
            optimist: "optimist",
            express: "express", 
            i18n: "i18n",
            MongoDBServer: "mongoskin",
            passport: "passport",
            WebIDE: `${__dirname}/.core/wi.core.webide.js`
        },
        virtual: { 
            dirname: `"${__dirname}"`,  
            app: "express()",
            argv: "optimist.argv",
            MongoStore: "require('connect-mongo')(require('express-session'))",
            mongodb: `MongoDBServer.db(settings['${env}'].mongodb, {native_parser:true})`,
            settings: `settings['${env}']`
        },
        preload_args: ["settings", "app", "i18n", "passport", "MongoStore"],
        preload: (settings, app, i18n, passport, MongoStore) => {
            i18n.configure({
                defaultLocale: "en",
                locales:['en'],
                directory: __dirname + '/locales'
            });     

            app.set('views', __dirname + '/public');
            app.set('view engine', 'ejs');
            app.use(i18n.init); 
            app.use(require('serve-static')(__dirname + '/public'));
            app.use(require('serve-static')(__dirname + '/.themes'));
            app.use(require('cookie-parser')());
            app.use(require('body-parser').urlencoded({ extended: true }));
            app.use(require('body-parser').json());
            app.use(require('express-session')({saveUninitialized: true, resave: true, secret: settings.session.secret, store: new MongoStore({url: settings.mongodb})}));
            app.use(passport.initialize());
            app.use(passport.session());
            app.use(require("connect-flash")());              
            app.use(require('express-minify-html')({
                override: true,
                exception_url: false,
                htmlMinifier: {
                    removeComments: true,
                    collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeEmptyAttributes: true,
                    minifyJS: true
                }
            }));    
        },
        /*map_args: ["settings", "dirname", "argv", "app", "i18n", "passport", "mongodb", "webide"],
        map: [`${__dirname}/src`],*/
        bootstrap_args: ["settings", "dirname", "argv", "app", "i18n", "passport", "mongodb", "WebIDE"],
        bootstrap: (settings, dirname, argv, app, i18n, passport, mongodb, WebIDE) => {    
            if(env == "dev"){
                let browserSync = require("browser-sync"),
                    chokidar = require("chokidar");
                    
                chokidar.watch(__dirname + "/.core/wi.core.webide.js").on('all', (event, path) => {
                    if(event == "change") console.log("restart application");
                    
                    let webide = new WebIDE();
                    webide.imports({app: app, app_settings: settings, dirname: dirname, argv: argv, i18n: i18n, passport: passport, mongodb: mongodb});
                    webide.load(() => { 
                        webide.boostrap();
                        
                        browserSync({
                            open: true,
                            proxy: "http://localhost:" + (settings.port+1),
                            files: ["public/**/*.*", ".themes/**/*.*", ".core/**/*.*", ".ide/**/*.*", ".plugins/**/*.*"],
                            port: settings.port,
                            injectChanges: true,
                            reloadOnRestart: false,
                            ghostMode: true
                        });

                        browserSync.watch(["public/**/*.css", ".themes/**/*.css", ".core/**/*.css", ".ide/**/*.css", ".plugins/**/*.css"], function (event, file) {                
                            if (event === "change")
                                browserSync.reload("build.min.css");
                        });
                        
                        browserSync.watch(["public/**/*.js", ".themes/**/*.js", ".core/**/*.js", ".ide/**/*.js", ".plugins/**/*.js"], function (event, file) {                
                            if (event === "change")
                                browserSync.reload("build.min.js");
                        });

                        app.listen(settings.port + 1, () => { console.log(`http://localhost:${settings.port+1}`); }); 
                    }); 
                });
            }
            else{
                let webide = new WebIDE();
                webide.imports({app: app, app_settings: settings, dirname: dirname, argv: argv, i18n: i18n, passport: passport, mongodb: mongodb});
                webide.load(() => { 
                    webide.boostrap();
                    app.listen(settings.port, () => { console.log(`http://localhost:${settings.port}`); }); 
                }); 
            }
        }
    });
//}


