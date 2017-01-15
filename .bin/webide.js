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
    optimist = require("optimist"),
    colors = require("colors"),
    gitclone = require("gitclone"),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn;

var args = optimist
    .usage("\nUsage:\n  " + colors.green("webide") + "  <command> [<args>] [<options>]\n"+
           "\nCommands:\n  " + colors.yellow("install") + "  Command to perform installation of WebIDE dependencies\n" + 
           "  " + colors.yellow("update") + "  Command to perform update of WebIDE dependencies\n" +
           "  " + colors.yellow("start") + "  Command to start WebIDE\n"+ 
           "  " + colors.yellow("build") + " Command to process and test WebIDE") 
    .alias("h", "help") 
    .alias("h", "?")
    .options("port", {
        string: true,
        describe: "The port that will be used by WebIDE."
    })
    .argv;
    
if(args.help){
    optimist.showHelp();
    return process.exit(-1);
}

if(args._.length > 0){
    switch(args._[0]){
        case "install":
            if(args._[1]){
                console.log("git clone " + args._[1]);
                let dirname =  __dirname + "/../.plugins/" + args._[1].split("/")[1];
            
                gitclone(args._[1], {dest: dirname}, (err) => {
                    if (err) console.error(err.buffer.toString());                
                    
                    //Install NPM 
                    fs.stat(dirname + "/package.json", (err, stats) => {        
                        if(stats){
                            console.log("Installing dependencies...");
                            let npmInstall  = exec("npm install --progress=false", { cwd: dirname });
                            npmInstall.stdout.on('data', (data) => { console.log(data.toString()); });
                            npmInstall.stderr.on('data', (data) => { console.log(data.toString()); });
                        }
                    });
                });
            }
            else{
                let install  = spawn('node', [__dirname + '/install.js']);
                install.stdout.on('data', (data) => { console.log(data.toString()); });
                install.stderr.on('data', (data) => { console.log(data.toString()); });
                install.on('close', (code) => { console.log("Installation complete"); });
            }
        break;
        case "update":
            let update  = spawn('node', [__dirname + '/update.js']);
            update.stdout.on('data', (data) => { console.log(data.toString()); });
            update.stderr.on('data', (data) => { console.log(data.toString()); });
            update.on('close', (code) => { console.log("Installation complete"); });
        break;
        case "start":
            let start  = spawn('node', [__dirname + '/../app.js']);
            start.stdout.on('data', (data) => { console.log(data.toString()); });
            start.stderr.on('data', (data) => { console.log(data.toString()); });
        break;
        case "build":
            let dirname =  __dirname + "/../";
            let build  = exec('node app.js --build', { cwd: dirname });
            build.stdout.on('data', (data) => { console.log(data.toString()); });
            build.stderr.on('data', (data) => { console.log(data.toString()); });
        break;
        default:
            optimist.showHelp();
            return process.exit(-1);
        break;
    }
}
else{
    optimist.showHelp();
    return process.exit(-1);
}