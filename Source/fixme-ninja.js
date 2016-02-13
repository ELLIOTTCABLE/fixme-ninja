import executable from './executable.js'

import Debug from 'debug'
const debug = Debug('fixme-ninja')

import Git from 'nodegit'
import pEvent from 'promisify-event'

export default async function ninja(path){
   let repo = await Git.Repository.open(path)
   let commit = await repo.getHeadCommit()
   debug(`HEAD: ${commit.id().toString()}`)

   let tree = await commit.getTree()
   let walker = tree.walk()
   let entries = pEvent(walker, 'end')
   walker.start()

   await Promise.all((await entries).map(async entry => {

      if (entry.isTree()) {
         debug(`Tree: ${entry.path()}`)
         let tree = await entry.getTree()

      } else { // isBlob()
         debug(`Blob: ${entry.path()}`)
         let blob = await entry.getBlob()
         console.log(entry.filename(), entry.sha(), blob.rawsize() + "b")
         console.log(blob.toString().split("\n").slice(0, 10).join("\n"))
         let indices = find_fixmes(blob.toString())
         console.log(indices)

      }
   }))
}

// FIXME: Make this less fucking ugly.
function find_fixmes(string){
   const indices = []
   let i

   while (true) {
      i = string.indexOf('FIXME:', i)
      if (i === -1) break
      indices.push(i)
   }

   return indices
}

export { executable }
