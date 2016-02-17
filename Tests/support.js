/* @flow */
import Debug from 'debug'
const debug = Debug('fixme-ninja:tests')

import pexec      from 'promise-exec'
import path       from 'path'
import fs         from 'fs'
import mkdirp     from 'mkdirp'
import Bluebird   from 'bluebird'
import _          from 'lodash'
const  mkdir    = Bluebird.promisify(mkdirp)

import { Test, Suite } from 'mocha'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

const should  = chai.should()
                chai.use(chaiAsPromised)

declare function before() : any
declare function after() : any


const module = require('../package.json')
    , working_dir = path.resolve(module.config.dirs.working)

before(function(){
   return mkdir(working_dir).then(function(){
      debug("Changing to working dir: %s", working_dir)
      process.chdir(working_dir)
   })
})

// FIXME: ALL of the CDs are happening before any tests run. I'm an idiot.
Test.prototype.cd = function cd(name:?string) : boolean {
   this.slug = _.kebabCase(name || this.fullTitle())
   const dir = path.resolve(working_dir, this.slug)
   var  prev = ''


   this.parent.beforeAll(function(){
      return mkdir(dir).then(function(){
         prev = process.cwd()

         debug("Changing to test dir: %s", dir)
         process.chdir(dir)
      })
   })
   this.parent.afterAll(function(){
      debug("Returning to dir: %s", prev)
      process.chdir(prev)
   })

   var isDirectory
   try {
      isDirectory = fs.statSync(dir).isDirectory()
   } catch (err) {
      if (err.code !== 'ENOENT') throw err
      return false
   }

   if (!isDirectory) throw new Error('y u is file doh,')
   return true
}


//function git(...args:Array<string>): Promise {
//   return new Promise((resolve, reject) => {
//      spawn('git', args, {stdio: ['ignore', 'ignore', 'inherit']})
//         .on('close', code => {
//            if (code === 0) resolve()
//            else reject(code)
//         })
//   })
//}

// This takes either a function, or an array of shell-commands. These are executed before any
// `needs()` of a test within this Suite.
//---
// TODO: Support nested Suites.
Suite.prototype.eachNeeds =
function eachNeeds(first: (string | ()=>any), ...commands: Array<string>) : void {
   if (null == this._eachNeeds)
      this._eachNeeds = []

   if (typeof first == 'string')
      commands.unshift(first)
   else
      this._eachNeeds.unshift(first)

   if (commands.length)
      this._eachNeeds = this._eachNeeds.concat(commands.map(function(str){
         const command = ()=> pexec(str)
         command.command = str
         return command
      }))
}

/* Adds a beforeAll that runs the specified commands. */
Test.prototype.needs =
function needs(first: (string | ()=>any), ...commands: Array<string>){
   const already_cached = this.cd()

   if (!already_cached) {
      debug("Scheduling re-creation for '%s'", this.title)
      var needs = []
      if (this.parent._eachNeeds)
         needs = needs.concat(this.parent._eachNeeds)

      if (typeof first == 'string')
         commands.unshift(first)
      else
         needs.unshift(first)

      if (commands.length)
         needs = needs.concat(commands.map(function(str){
            const command = ()=> pexec(str)
            command.command = str
            return command
         }))

      debug("'%s' needs: %o", this.title, needs)

      needs.forEach(need =>
         this.parent.beforeAll(`'${this.title}': ${need.command}`, need) )
   }
}

export { should }
