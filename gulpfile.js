/**
 * Integration file to Gulp
 * @author André Ferreira <andrehrf@gmail.com>
 */

'use strict';

let argv = require('optimist').argv,
    gulp = require("gulp"),
    nodemon = require("gulp-nodemon"),
    browserSync = require("browser-sync");
        
gulp.task("default", ["browser-sync", "nodemon"], () => {});

gulp.task("browser-sync", () => {
    browserSync({
        open: false,
        proxy: "http://localhost:80",
        files: ["public/**/*.*"],
        port: 9006,
        ghostMode: true 
    });
});

gulp.task("nodemon", () => {
    nodemon({
        script: 'app.js',
        ignore: ["public/*", "node_modules/"],
        env: {'NODE_ENV': 'dev'},
        args: ["--port=80"],
        exec: "node --harmony --expose-gc --max-old-space-size=2048"
    }).on("start");
});