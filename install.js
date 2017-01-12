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

let fs = require("fs"),
    package = require("./package"),
    gitclone = require('gitclone'),
    mkdirp = require('mkdirp');
    
//Install core modules
mkdirp('.core', function (err) {
    if(package.dependenciesCore){
        for(let keyCore in package.dependenciesCore){
            console.log("git clone jsrun/" + keyCore);
            gitclone('jsrun/' + keyCore, {dest: '.core/' + keyCore, branch: package.dependenciesCore[keyCore]}, (err) => {
                if (err) return console.error(err.buffer.toString());
            });
        }
    }
});

//Install IDE modules
mkdirp('.ide', function (err) {
    if(package.dependenciesIDE){
        for(let keyIDE in package.dependenciesIDE){
            console.log("git clone jsrun/" + keyIDE);
            gitclone('jsrun/' + keyIDE, {dest: '.ide/' + keyIDE, branch: package.dependenciesIDE[keyIDE]}, (err) => {
                if (err) return console.error(err.buffer.toString());
            });
        }
    }
});

//Install Plugins modules
mkdirp('.plugins', function (err) {
    if(package.dependenciesPlugins){
        for(let keyPlugins in package.dependenciesPlugins){
            console.log("git clone jsrun/" + keyPlugins);
            gitclone('jsrun/' + keyPlugins, {dest: '.plugins/' + keyPlugins, branch: package.dependenciesPlugins[keyPlugins]}, (err) => {
                if (err) return console.error(err.buffer.toString());
            });
        }
    }
});

//Install Ace Editor
console.log("git clone ajaxorg/ace-builds");
gitclone('ajaxorg/ace-builds', {dest: 'public/ace'}, (err) => {
    if (err) return console.error(err.buffer.toString());
});

mkdirp('.workspaces', function (err) { if(err) console.log(err); });
mkdirp('.components', function (err) { if(err) console.log(err); });