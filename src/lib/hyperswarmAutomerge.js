// https://github.com/hyperswarm/hyperswarm

//import { Frontend, ChangeFn } from 'automerge'
import { Frontend } from 'automerge'
import hyperswarm from 'hyperswarm'
import crypto from 'crypto'
import Replicator from '@hyperswarm/replicator'
import stream from 'stream'

const swarm = hyperswarm()

const r = new Replicator()

// look for peers listed under this topic
const topic = crypto.createHash('sha256')
  .update('my-hyperswarm-topic')
  .digest()
console.log("topic: ", topic.toString('hex'))


swarm.join(topic, {
  lookup: true, // find & connect to peers
  announce: true // optional- announce self as a connection target
})

const inOutStream = new stream.Duplex({
  write: function(chunk, encoding, callback) {
    console.log(chunk.toString())
    callback()
  },
  read(size) {
    this.push("HELLOOOOOOOOOOO")
  }
})

// https://stackoverflow.com/questions/12713564/function-in-javascript-that-can-be-called-only-once
let onetime = (function(socket) {
  let executed = false
  return function(socket) {
    if (!executed) {
      executed = true
      console.log("PROVA")
      inOutStream.pipe(socket).pipe(process.stdout)
    }
  }
})()



swarm.on('connection', (socket, info) => {
  console.log('new connection!', info)
  // you can now use the socket as a stream, eg:
  //process.stdin.pipe(socket).pipe(process.stdout)
  //inOutStream.pipe(socket).pipe(process.stdout)
  onetime(socket)
})


