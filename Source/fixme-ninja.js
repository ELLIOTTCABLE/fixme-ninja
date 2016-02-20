/* @flow */
import executable from './executable.js'

import Debug from 'debug'
const debug = Debug('fixme-ninja')

import Git from 'nodegit'
import Kit from 'nodegit-kit'


var support = {}

// FIXME: Make this less fucking ugly.
const find_fixmes = support.find_fixmes =
function find_fixmes(string: string) : Array<number> {
   const indices = []
   let i

   while (true) {
      i = string.indexOf('FIXME:', i + 1)
      if (i === -1) break
      indices.push(i)
   }

   return indices
}

const is_bare = support.is_bare =
async function is_bare(repo: Git.Repository) : Promise {
   try {
      const value = await Kit.config.get(repo, 'core.bare')
      if (value === 'true')  return true
      if (value === 'false') return false
      else throw new Error(`Unknown configuration value for 'core.bare': "${value}"`)
   } catch (err) {
      if (err.message !== "Config value 'core.bare' was not found") throw err
      else return null
   }
}


export { executable, support }

export default
async function ninja(path = '.': string) : Promise {
   const repo = await Git.Repository.open(path)
       , bare = await is_bare(repo)

   if (bare) {

   } else {

   }
}
