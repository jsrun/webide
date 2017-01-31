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

let define = require("organized").load;

define({ 
    settings: `${__dirname}/settings.json`,
    optimist: "optimist",
    express: "express", 
    i18n: "i18n",
    MongoDBServer: "mongoskin",
    passport: "passport",
    WebIDE: `${__dirname}/webide.js`,
    SocketIO: "socket.io",
    glob: "glob",
    env: () => { return process.env.NODE_ENV || "dev"; },
    dirname: () => { return __dirname; },
    app: (express) => { return express(); },
    argv: (optimist) => { return optimist.argv; },
    MongoStore: () => { return require('connect-mongo')(require('express-session')); },
    mongodb: (settings, env, MongoDBServer) => { return MongoDBServer.db(settings[env].mongodb, {native_parser:true}); }
}, {    
    provider: (app, passport, MongoStore, settings, env, i18n) => {
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
        app.use(require('express-session')({saveUninitialized: true, resave: true, secret: settings[env].session.secret, store: new MongoStore({url: settings[env].mongodb})}));
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
        
        return true;
    },
    scope: (_this, app, provider, SocketIO, mongodb, env, settings, WebIDE, argv, glob) => { 
        var server = require('http').createServer(app);
        var io = SocketIO(server);
        _this.set("io", io);
        
        if(env == "dev" || argv.dev == "true"){
            let browserSync = require("browser-sync"),
                chokidar = require("chokidar");

            chokidar.watch(__dirname + "/webide.js").on('all', (event, path) => {
                if(event == "change") console.log("restart application");
                
                let webide = new WebIDE();
                webide.imports(_this);
                webide.load(() => {
                    webide.boostrapDev();
                    
                    browserSync.watch(glob.sync("./**/*.css", {dot: true, cwd: __dirname, ignore: ["./node_modules/*"]}), (event, file) => {                
                        if(event === "change")
                            browserSync.reload("build.min.css");
                    });

                    browserSync.watch(glob.sync("./**/*.js", {dot: true, cwd: __dirname, ignore: ["./node_modules/*"]}), (event, file) => {                
                        if (event === "change")
                            browserSync.reload("build.min.js");
                    });

                    setTimeout(() => { 
                        server.listen(settings[env].port + 1, () => { 
                            browserSync({
                                open: true,
                                proxy: "http://localhost:" + (settings[env].port+1),                            
                                port: settings[env].port,
                                injectChanges: true,
                                reloadOnRestart: false,
                                ghostMode: false
                            });
                    
                            console.log(`http://localhost:${settings[env].port+1}`); 
                        }); 
                    }, 300);
                }); 
            });
        }
        else{
            /*let webide = new WebIDE();
            webide.imports({app: app, app_settings: settings, dirname: dirname, argv: argv, i18n: i18n, passport: passport, mongodb: mongodb, io: io});
            webide.load(() => { 
                webide.boostrap();
                server.listen(settings.port, () => { console.log(`http://localhost:${settings.port}`); }); 
            });*/ 
        }
    }
}, { require: require });
      
      


