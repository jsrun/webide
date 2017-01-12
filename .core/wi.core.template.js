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

module.exports = function(filename){
    let fs = require("fs"), 
        ejs = require("ejs");

    return {
        /**
         * Template contents
         * @type string
         */
        template: fs.readFileSync(filename).toString(),
        
        /**
         * Internacionalization module
         * @type object
         */
        i18n: null,
        
        /**
         * Function to set internacionalization module
         * 
         * @param object i18n
         * @return this
         */        
        seti18n: function(i18n){
            this.i18n = i18n;
            return this;
        },

        /**
         * Function to render template
         * 
         * @param object|null params
         * @return string
         */
        render: function(params){
            if(!params)
                params = {};
            
            if(typeof this.i18n == "object")
                if(typeof this.i18n.__ == "function")
                    params["__"] = this.i18n.__;
            
            return ejs.render(this.template, params);
        }
    }
}
