'use strict'

var util = require('util'),
    ws = require('ws'),
    WebSocketServer = ws.Server,
    EventEmitter = require('events')

module.exports = class WSProxy extends EventEmitter {

  constructor(target) {
    super()

    if (!target) {
      throw new TypeError("No target given")
    }

    this.target = target
    this.server = null    
  }

  listen(port, host) {
    var self = this

    function listening() {
      self.emit('listening')
    }

    if (typeof arguments[arguments.length - 1] == 'function') {
      this.on('listening', arguments[arguments.length - 1])
    }

    if (this.server) {
      throw new Error("Already running")
    }

    if (typeof port == 'object') {
      this.server = new WebSocketServer({ server: port }, listening)
    }
    else {
      this.server = new WebSocketServer({ port: port, host: host }, listening)
    }

    this.server.on('connection', function (incoming) {
      var outgoing = new ws(self.target),
          open = false
          queue = []

      outgoing.on('open', function () {
        open = true
        var item
        while (item = queue.shift()) {
          outgoing.send(item)
        }
      });

      incoming.on('message', function (msg) {
        open ? outgoing.send(msg) : queue.push(msg)
      });

      outgoing.on('message', function (msg) {
        incoming.send(msg)
      });
    })
  }
  
  close () {
    if (!this.server) {
      throw new Error("Not running")
    }

    this.server.close()
    this.server = null
  }

}
