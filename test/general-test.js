/**
 *  __          __  _    _____ _____  ______ _______        _   
 *  \ \        / / | |  |_   _|  __ \|  ____|__   __|      | |  
 *   \ \  /\  / /__| |__  | | | |  | | |__     | | ___  ___| |_ 
 *    \ \/  \/ / _ \ '_ \ | | | |  | |  __|    | |/ _ \/ __| __|
 *     \  /\  /  __/ |_) || |_| |__| | |____ _ | |  __/\__ \ |_ 
 *      \/  \/ \___|_.__/_____|_____/|______(_)|_|\___||___/\__|
 *                                                                                                                                                                                                   
 *  @author André Ferreira <andrehrf@gmail.com>
 *  @license MIT
 */

"use strict";

let os = require("os"),
    assert = require("assert"),
    glob = require("glob");
    
describe("Testing functions required for WebIDE operation", () => {
    it("The platform should be linux or win32", () => { assert.equal(os.platform(), "linux" || "win32"); });
    
    //Test core dependencies
    //Test ide 
    //Test plugins
});