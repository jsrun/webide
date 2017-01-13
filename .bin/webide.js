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

let optimist = require("optimist"),
    colors = require("colors"),
    spawn = require('child_process').spawn;

var args = optimist
    .usage("\nUsage:\n  " + colors.green("webide") + "  <command> [<args>] [<options>]\n"+
           "\nCommands:\n  " + colors.yellow("install") + "  Command to perform installation of WebIDE dependencies\n" + 
           "  " + colors.yellow("update") + "  Command to perform update of WebIDE dependencies\n" +
           "  " + colors.yellow("start") + "  Command to start WebIDE")
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
            let install  = spawn('node', [__dirname + '/install.js']);
            install.stdout.on('data', (data) => { console.log(data.toString()); });
            install.stderr.on('data', (data) => { console.log(data.toString()); });
            install.on('close', (code) => { console.log("Installation complete"); });
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