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
    glob = require("glob"),
    env = process.env.NODE_ENV || "dev";

app.config({   
    modules: {
        settings: `${__dirname}/settings.json`,
        optimist: "optimist",
        express: "express", 
        i18n: "i18n",
        MongoDBServer: "mongoskin",
        passport: "passport",
        WebIDE: `${__dirname}/webide.js`,
        SocketIO: "socket.io"
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

        app.set('views', __dirname + '/static');
        app.set('view engine', 'ejs');
        app.use(i18n.init); 
        app.use(require('serve-static')(__dirname + '/static', {index: false}));
        app.use(require('serve-static')(__dirname + '/.themes', {index: false}));
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
    bootstrap_args: ["settings", "dirname", "argv", "app", "i18n", "passport", "mongodb", "SocketIO", "WebIDE"],
    bootstrap: (settings, dirname, argv, app, i18n, passport, mongodb, SocketIO, WebIDE) => {    
        var server = require('http').createServer(app);
        var io = SocketIO(server);

        if(env == "dev" || argv.dev == "true"){
            let browserSync = require("browser-sync"),
                chokidar = require("chokidar");

            chokidar.watch(__dirname + "/webide.js").on('all', (event, path) => {
                if(event == "change") console.log("restart application");


                let webide = new WebIDE();
                webide.imports({app: app, app_settings: settings, dirname: dirname, argv: argv, i18n: i18n, passport: passport, mongodb: mongodb, io: io});
                webide.load(() => { 
                    if(!argv.build){
                        webide.boostrapDev();

                        browserSync({
                            open: true,
                            proxy: "http://localhost:" + (settings.port+1),                            
                            port: settings.port,
                            injectChanges: true,
                            reloadOnRestart: false,
                            ghostMode: false
                        });

                        //browserSync.watch(glob.sync(["public/**/*.css", ".themes/**/*.css", ".core/**/*.css", ".ide/**/*.css", ".plugins/**/*.css"]), function (event, file) {                
                        //    if (event === "change")
                        //        browserSync.reload("build.min.css");
                        //});

                        //browserSync.watch(glob.sync(["public/**/*.js", ".themes/**/*.js", ".core/**/*.js", ".ide/**/*.js", ".plugins/**/*.js"]), function (event, file) {                
                        //    if (event === "change")
                        //        browserSync.reload("build.min.js");
                        //});
                        
                        setTimeout(function(){ server.listen(settings.port + 1, () => { console.log(`http://localhost:${settings.port+1}`); }); }, 300);
                    }
                    else{
                        webide.boostrap();
                        setTimeout(function(){ process.exit(1); }, 3000);
                    }
                }); 
            });
        }
        else{
            let webide = new WebIDE();
            webide.imports({app: app, app_settings: settings, dirname: dirname, argv: argv, i18n: i18n, passport: passport, mongodb: mongodb, io: io});
            webide.load(() => { 
                webide.boostrap();
                server.listen(settings.port, () => { console.log(`http://localhost:${settings.port}`); }); 
            }); 
        }
    }
});



