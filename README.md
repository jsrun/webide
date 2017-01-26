``` 
  __          __  _    _____ _____  ______ 
  \ \        / / | |  |_   _|  __ \|  ____|
   \ \  /\  / /__| |__  | | | |  | | |__   
    \ \/  \/ / _ \ '_ \ | | | |  | |  __|  
     \  /\  /  __/ |_) || |_| |__| | |____ 
      \/  \/ \___|_.__/_____|_____/|______|   
                                                                                                                                                                                                                                                                                                                                                                                                                                               
```                                                                                                                                                 

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/jsrun/webide/master/LICENSE)
[![GitHub version](https://badge.fury.io/gh/jsrun%2Fwebide.svg)](https://badge.fury.io/gh/jsrun%2Fwebide)

Fully web-based multi-language development application

## Dependencies

* Nodejs v6+ https://nodejs.org
* MongoDB v3+ https://www.mongodb.com
* Docker v1.13.0-rc5+ https://www.docker.com
* Git v2.10.0+ https://git-scm.com/
* OpenSSL

## Dependencies on Windows

```bash
$ npm install -g node-gyp
$ npm --vcc-build-tools-parameters='[""/Full""]' install --global windows-build-tools
$ set PYTHONPATH=/path/to/python2.7
$ set PYTHON=%PYTHONPATH%/python.exe
$ node-gyp --python /path/to/python2.7
$ npm config set python /path/to/executable/python2.7
$ npm config set msvs_version 2015
```

Configuration tutorial - https://www.robertkehoe.com/2015/03/fix-node-gyp-rebuild-error-on-windows/

## Install

Mode development
```bash
$ sudo apt install libssl-dev
$ git clone https://github.com/jsrun/webide
$ cd webide
$ npm install --progress=false
$ npm install -g bower
$ bower install
$ /.bin/install.js
$ node app.js
```

Docker
```bash
$ git clone https://github.com/jsrun/webide
$ docker-compose up -d --build
```

## License

  MIT
  
  Copyright (C) 2016 André Ferreira

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.