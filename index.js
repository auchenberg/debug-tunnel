'use strict'

var process = require('process')
var http = require('http')
var Proxy = require('./proxy')

module.exports = new class DebugTunnel {

    constructor() {
        this.proxy = null;
    }

    start(options) {
        console.log('hello')

        var server = http.createServer((req, res) => {
            console.log('req.url', req.url)

            // res.writeHead(200, {
            //     "Content-Type": "application/json"
            // })

            if(req.url.match(`/_debug_tunnel`)) {
                 console.log('debug_tunnel.request', req.url)
                 var token = '123'
                 if(token = process.env.DEBUG_TUNNEL_TOKEN) {

                    if(!this.proxy) {
                        if (!process.pid) {
                            throw new Error('No process.pid available')
                        }

                        // 1) Fire SIG to this processs to start V8+inspector
                        if (process.platform === 'win32') {
                            process._debugProcess(process.pid)
                        } else {
                            process.kill(process.pid, 'SIGUSR1')
                        }

                        // 2) Start WS socket proxy to proxy V8_inspector to outer world
                        this.proxy = new Proxy('ws://localhost:9223')
                    }

                    // 3) Return endpoint data in JSON like response

                    console.log('req', req)

                    res.writeHead(302, {
                    'Location': `${req.protocol}://${req.hostname}:9229/json` 
                    });
                    res.end();

                
                 }
            }

            res.end()
        });

        let port = process.env.PORT || 9222

        server.listen(port, () => {
            console.log(`debug_tunnel ready on port ${port}`)
        })
        
    }
}