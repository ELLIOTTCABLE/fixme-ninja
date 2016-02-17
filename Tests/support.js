/* @flow */
import Debug from 'debug'
const debug = Debug('fixme-ninja:tests:support')

import pexec      from 'promise-exec'
import path       from 'path'
import fs         from 'fs'
import mkdirp     from 'mkdirp'
import Bluebird   from 'bluebird'
import _          from 'lodash'
const  mkdir    = Bluebird.promisify(mkdirp)

import { Suite, Test, Hook } from 'mocha'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import sinonAsPromised from 'sinon-as-promised'

const should  = chai.should()
                chai.use(chaiAsPromised)
                chai.use(sinonChai)

declare function before() : any
declare function after() : any


const module      = require('../package.json')
    , cwd         = process.cwd()
    , working_dir = path.resolve(module.config.dirs.working)

before(function(){
   return mkdir(working_dir).then(function(){
      debug("Changing to working dir: %s", working_dir)
      process.chdir(working_dir)
   })
})

// This monkey-patches `beforeThis`-ish functionality into Mocha: `needs()` will register a `before`
// hook onto the `Test` instance *itself*, specific to that `Test`. (Doesn't work as a fully-fledged
// Mocha `Hook`.)
//
// Of note, if any of the hooks returns a Promise, then the test *becomes* an asynchronous test;
// eventually returning a promise that fulfills with the synchronous return-value of the body.
//---
// TODO: This *should* be a library that actually extends Mocha with a new `Runnable`/`Hook`, on
//       `Test` instead of on `Suite`, but ... whatever.
// FIXME: This assumes the `Test` is already Promise-based. Support explicit-async (with `done`) and
//        synchronous (no arguments, doesn't return a promise.)
Test.prototype.enableBefores = function enableBefores() : Test {
   const self          = this
       , parent        = this.parent
       , original_body = this.fn

   if (null == this._before)
      this._before = []

   if (null == this.fn._callsBefores) {
      this.fn = function callBefores(...args : Array<any>) : Promise {

         const defer = to => {
            if (self._hasBecomeAsync) return Promise.resolve(to.apply(this, args))
            else                      return to.apply(this, args)
         }

         if (self._before.length > 0) {
            debug(`callBefore: '${self.title}' @${self._before.length}`)

            const next = self._before.shift()
                , rv   = next.apply(this, args)

            if (rv && typeof rv.then == 'function'){
               debug(`callBefore: '${self.title}' @${self._before.length} was async`)
               self._hasBecomeAsync = true
               return rv.then( ()=> callBefores.apply(this, args) )
            }
            else return defer(callBefores)
         }
         else return defer(original_body)

      }
      this.fn._callsBefores = true
   }

   return this
}

Test.prototype.beforeThis = function beforeThis(...fns: Array<()=>any>) : Test {
   this.enableBefores()
   this._before.push(...fns)

   return this
}

// Indicates that this test needs to run commands in a test-specific directory. Tests flagged this
// way have a directory created in `module.config.dirs.working` from the test's slug-ified name.
//---
// FIXME: ALL of the CDs are happening before any tests run. I'm an idiot.
Test.prototype.needsDir = function needsDir(name:?string) : boolean {
   this.enableBefores()
   if (null == this.slug)
      this.slug = _.kebabCase(this.parent ? this.fullTitle() : this.title)

   const dir           = path.resolve(working_dir, name ? _.kebabCase(name) : this.slug)

 //this.parent.beforeAll(function(){
 //   return mkdir(dir).then(function(){
 //      prev = process.cwd()

 //      debug("Changing to test dir: %s", dir)
 //      process.chdir(dir)
 //   })
 //})
 //this.parent.afterAll(function(){
 //   debug("Returning to dir: %s", prev)
 //   process.chdir(prev)
 //})

 //var isDirectory
 //try {
 //   isDirectory = fs.statSync(dir).isDirectory()
 //} catch (err) {
 //   if (err.code !== 'ENOENT') throw err
 //   return false
 //}

 //if (!isDirectory) throw new Error('y u is file doh,')
 //return true
}


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

export { should, sinon }
