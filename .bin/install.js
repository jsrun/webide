/**
 *  __          __  _    _____ _____  ______ 
 *  \ \        / / | |  |_   _|  __ \|  ____|
 *   \ \  /\  / /__| |__  | | | |  | | |__   
 *    \ \/  \/ / _ \ "_ \ | | | |  | |  __|  
 *     \  /\  /  __/ |_) || |_| |__| | |____ 
 *      \/  \/ \___|_.__/_____|_____/|______|
 *                                                                            
 *  @author André Ferreira <andrehrf@gmail.com>
 *  @license MIT
 */

let fs = require("fs"),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    package = require("../package"),
    gitclone = require("gitclone"),
    mkdirp = require("mkdirp");
    
//Install core modules
mkdirp(__dirname + "/../.core", function (err) {
    if(package.dependenciesCore){
        for(let keyCore in package.dependenciesCore){
            console.log("git clone jsrun/" + keyCore);
            
            gitclone("jsrun/" + keyCore, {dest: __dirname + "/../.core/" + keyCore, branch: package.dependenciesCore[keyCore]}, (err) => {
                //if (err) console.error(err.buffer.toString());                
                loadDependencies(keyCore, __dirname + "/../.core/" + keyCore);
            });
        }
    }
});

//Install IDE modules
mkdirp(__dirname + "/../.ide", function (err) {
    if(package.dependenciesIDE){
        for(let keyIDE in package.dependenciesIDE){
            console.log("git clone jsrun/" + keyIDE);
            
            gitclone("jsrun/" + keyIDE, {dest: __dirname + "/../.ide/" + keyIDE, branch: package.dependenciesIDE[keyIDE]}, (err) => {
                //if (err) console.error(err.buffer.toString());                
                loadDependencies(keyIDE, __dirname + "/../.ide/" + keyIDE);
            });
        }
    }
});

//Install Plugins modules
mkdirp(__dirname + "/../.plugins", function (err) {
    if(package.dependenciesPlugins){
        for(let keyPlugins in package.dependenciesPlugins){
            console.log("git clone jsrun/" + keyPlugins);
            
            gitclone("jsrun/" + keyPlugins, {dest: __dirname + "/../.plugins/" + keyPlugins, branch: package.dependenciesPlugins[keyPlugins]}, (err) => {
                //if (err) console.error(err.buffer.toString());                
                loadDependencies(keyPlugins, __dirname + "/../.plugins/" + keyPlugins);
            });
        }
    }
});

//Install Ace Editor
console.log("git clone ajaxorg/ace-builds");
gitclone("ajaxorg/ace-builds", {dest: __dirname + "/../public/ace"}, (err) => {
    //if (err) return console.error(err.buffer.toString());
});

mkdirp(__dirname + "/../.workspaces", function (err) { if(err) console.log(err); });
mkdirp(__dirname + "/../.components", function (err) { if(err) console.log(err); });
mkdirp(__dirname + "/../src", function (err) { if(err) console.log(err); });

function loadDependencies(namespace, dirname){
    dirname = fs.realpathSync(dirname);//Fix path
    
    fs.stat(dirname + "/webide.json", (err, stats) => {
        if(stats){
            try{
                let webideJson = require(dirname + "/webide.json");

                if(webideJson.dependencies){
                    //console.log("Installing dependencies...");

                    for(var keyDependencies in webideJson.dependencies){
                        gitclone(keyDependencies, {dest: dirname + "/" + keyDependencies}, (err) => {
                            //if (err) return console.error(err.buffer.toString());
                        });
                    }
                }
            }
            catch(e){
                console.log(e.message);
            }
        }
    });
        
    //Install NPM 
    fs.stat(dirname + "/package.json", (err, stats) => {        
        if(stats){
            let npmInstall  = exec("npm install --progress=false", { cwd: dirname });
            npmInstall.stdout.on('data', (data) => { console.log(data.toString()); });
            npmInstall.stderr.on('data', (data) => { console.log(data.toString()); });
        }
    });
}