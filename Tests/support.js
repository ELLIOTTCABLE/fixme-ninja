/* @flow */
import Debug from 'debug'
const debug = Debug('fixme-ninja:tests:support')

import child_process from 'child_process'
import path          from 'path'
import _fs           from 'fs'
import _mkdir        from 'mkdirp'
import Bluebird      from 'bluebird'
import _             from 'lodash'
const  fs          = Bluebird.promisifyAll(_fs)
const  mkdir       = Bluebird.promisify(_mkdir)

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


// Resolves to a boolean; `true` if the path exists *and* is a directory, and `false` if the path
// does not exist. Rejects with an error otherwise.
function directoryExists(path: string) : Promise {
   return new Promise((resolve, reject) => {
      fs.stat(path, (err, stat)=> {
         if (null != err) {
            debug("fs.stat threw: %o", err)
            if (err.code === 'ENOENT') return resolve(false)
            else                       return reject(err)
         } else if (!stat.isDirectory()) {
            const errNotDir =
               new Error("Path exists, but is not a directory: " + path)
            // FIXTYPE: I think Flow wants me to create a new Error class, here.
            errNotDir.code = 'ENOTDIR'; errNotDir.path = dir
            return reject(errNotDir)
         } else {
            return resolve(true)
         }
      })
   })
}

if (null == Suite.rootWorkingDir)
   Suite.rootWorkingDir = process.cwd()

const module      = require('../package.json')
    , cwd         = process.cwd()

Suite.rootWorkingDir = path.resolve(module.config.dirs.working)

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
            const next = self._before.shift()
                , rv   = next.apply(this, args)

            if (rv && typeof rv.then == 'function'){
               self._hasBecomeAsync = true
               return rv.then( ()=> callBefores.apply(this, args) )
            } else return defer(callBefores)
         } else return defer(original_body)

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
//
// This implicitly causes the test to execute asynchronously.
//---
// TODO: More flexible configuration / handling of Suite.workingDir
// TODO: More flexible afterThis or something, instead of the hacky restorePWD
Test.prototype.needsDir = function needsDir(name:?string) : Test {
   const self          = this
       , parent        = this.parent

   if (null != this._needsDir)
      return this

   if (null == this.slug)
      this.slug = _.kebabCase(parent ? this.fullTitle() : this.title)

   if (parent && null == parent.workingDir)
      parent.workingDir = Suite.rootWorkingDir

   const original_body = this.fn
       , previous_dir = process.cwd()
       , parent_dir = parent ? parent.workingDir : process.cwd()

   if (null == this.dir)
      this.dir = path.resolve(parent_dir, name ? _.kebabCase(name) : this.slug)

   this.fn = function restorePWD(...args : Array<any>) {
      const rv = original_body.apply(this, args)
      process.chdir(previous_dir)
      return rv
   }

   this.beforeThis(() => directoryExists(this.dir).then(exists => {
      if (exists) {
         debug(`Working-dir exists for ${this.slug} at: '${this.dir}'`)
         this._needsDirInitialization = false
         process.chdir(this.dir)

      } else return mkdir(this.dir).then( ()=> {
         debug(`Working-dir created for ${this.slug} at: '${this.dir}'`)
         this._needsDirInitialization = true
         process.chdir(this.dir)
         debug("Changed to test dir, now in: %s", process.cwd())
      })
   }) )

   this._needsDir = true
   return this
}


// This takes either a function, or an array of shell-commands. These are executed before any
// `needs()` of a test within this Suite.
//---
// TODO: Support nested Suites.
Suite.prototype.setupEach =
function setupEach(...commands){
   this._setupEachCommands = (this._setupEachCommands || []).concat(commands)
}

Test.prototype.setup =
function setup(...commands){
   const self          = this
       , parent        = this.parent

   if (null == this._setupCommands && parent && parent._setupEachCommands)
      commands = parent._setupEachCommands.concat(commands)

   this._setupCommands = true

   if (commands.length) {
      this.needsDir()

      commands.forEach(command => this.beforeThis( ()=> new Promise( (resolve, reject)=> {
         child_process.exec(command, {}, (err, stdout, stderr)=> {
            if (err) reject(err)
            else     resolve(stdout)
         })
      })))
   }

   return this
}

export { should, sinon }
