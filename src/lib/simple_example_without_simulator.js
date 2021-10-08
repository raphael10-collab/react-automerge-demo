const {PubSub} = require('hyperpubsub').debug()
const {Server, Client} = require('hyperspace')
const sodium = require('sodium-universal')

//const publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES)
//const secretKey = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES)
//sodium.crypto_box_keypair(publicKey, secretKey)

async function setUpHyperspace() {
  let client, server
  try {
    client = new Client()
    await client.ready()
  } catch(e) {
    console.log('no hyperspace server running, starting up a new one')
    server = new Server()
    await server.ready()
    client = new Client()
    await client.ready()
  }
  return {client, server}
}

setUpHyperspace().then(({client}) => {

  const pubsub = new PubSub(client.network, {application: 'example app', onError: console.error})

  pubsub.sub('some topic', (msg, app) => console.log(msg.toString('utf-8')), true) // messages are binary blobs

  setInterval(send, 1000)
  function send() {
      pubsub.pub('some topic', Buffer.from('hello marco', 'utf-8'))
  }
})

