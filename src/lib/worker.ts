/* eslint-env worker */
import {
  Backend, BackendState, decodeChange, SyncState,
} from 'automerge'
import type { BackendToFrontendMessage, GrossEventDataProtocol } from './types'
import { DB } from './db'

declare const self: WorkerGlobalScope

// ERRRRR
const workerId = Math.round(Math.random() * 1000).toString()

const backends: { [docId: string]: BackendState } = {}
const syncStates: { [peerId: string]: { [docId: string]: SyncState } } = {}

// In real life, you'd open a websocket or a webRTC thing, or ... something.
export const channel = new BroadcastChannel('automerge-demo-peer-discovery')

const db = new DB()

// must we store these on disk?
// how are they corrected aside if they go funky aside from somehow
// successfully syncing the whole repo?

// This function is mostly here to give me type checking on the communication.
const sendMessageToRenderer = (message: BackendToFrontendMessage) => {
  postMessage(message)
}

export function sendMessage(message: GrossEventDataProtocol) {
  channel.postMessage(message)
}

function updatePeers(docId: string) {
  Object.entries(syncStates).forEach(([peer, syncState]) => {
    const [nextSyncState, syncMessage] = Backend.generateSyncMessage(
      backends[docId],
      syncState[docId] || Backend.initSyncState(),
    )
    syncStates[peer] = { ...syncStates[peer], [docId]: nextSyncState }
    if (syncMessage) {
      sendMessage({
        docId, source: workerId, target: peer, syncMessage,
      })
    }
  })
}

// Respond to messages from the frontend document
self.addEventListener('message', (evt: any) => {
  const { data } = evt
  const { docId } = data

  if (data.type === 'OPEN') {
    backends[docId] = Backend.init()
    db.getDoc(docId).then(({ serializedDoc, changes }) => {
      backends[docId] = serializedDoc
        ? Backend.load(serializedDoc)
        : Backend.init()
      const [newBackend, patch] = Backend.applyChanges(
        backends[docId],
        changes,
      )
      backends[docId] = newBackend
      const isNewDoc = changes.length === 0
      sendMessageToRenderer({ docId, patch, isNewDoc })
    })
  }

  if (data.type === 'LOCAL_CHANGE') {
    const [newBackend, patch, change] = Backend.applyLocalChange(backends[docId], data.payload)
    sendMessageToRenderer({ docId, patch })

    const decodedChange = decodeChange(change)
    db.storeChange(docId, (decodedChange as any).hash, change)

    backends[docId] = newBackend
  }

  // now tell everyone else about how things have changed
  updatePeers(docId)
})

// Respond to messages from other peers
channel.addEventListener('message', ({ data }: any) => {
  const { source, target } = data as GrossEventDataProtocol

  if (target && target !== workerId) { return /* ain't for us */ }

  // think more about reconnection...
  if (data.type === 'HELLO') {
    if (syncStates[source] === undefined) {
      syncStates[source] = {}
      sendMessage({ source: workerId, target: source, type: 'HELLO' })
    }
    return
  }

  // it's safe to peel these out now, because we've type-discriminated away the HELLO messages
  const { docId, syncMessage } = data

  if (!backends[docId]) { return }

  const [nextBackend, nextSyncState, patch] = Backend.receiveSyncMessage(
    backends[docId],
    syncStates[source][docId] || Backend.initSyncState(),
    syncMessage,
  )
  backends[docId] = nextBackend
  syncStates[source] = { ...syncStates[source], [docId]: nextSyncState }

  updatePeers(docId)

  // TODO: batch these until synced
  if (patch) {
    sendMessageToRenderer({ docId, patch })
  }
})

// announce ourselves to the other peers
// (this is a bit inelegant)
sendMessage({ source: workerId, type: 'HELLO' })
