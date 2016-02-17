import { should, sinon } from './support.js'

import Debug from 'debug'
const debug = Debug('fixme-ninja:tests')

import ninja from '../'


import { Suite, Test } from 'mocha'

describe("Meta", function(){
//   describe("`git` support-function", function(){
//
//      it("evaluates", function(){
//         (_=>{ git('show') }).should.not.throw()
//      })
//
//      it("returns a Promise", function(){
//         git('show').should.be.an.instanceof(Promise)
//      })
//
//      it("resolves on completion", function(){
//         return git('show').should.be.fulfuilled
//      })
//
//      it("rejects on failure", function(){
//         return git('show', 'deadbeef').should.be.rejected
//      })
//
//   })

   describe("Mocha monkey-patching", function(){
      describe("Test::enableBefores()", function(){

         it("exists", function(){
            const test = new Test()

            should.exist(test.enableBefores)
         })

         it("doesn't throw", function(){
            const test = new Test('foo', ()=>{})

            ~function(){ test.enableBefores() }.should.not.throw()
         })

         it("throws when there is no test body", function(){
            const test = new Test()

            ~function(){ test.enableBefores() }.should.throw()
         })

         it("doesn't throw when called multiple times", function(){
            const test = new Test('foo', ()=>{})

            test.enableBefores()
            ~function(){ test.enableBefores() }.should.not.throw()
         })

         it("doesn't stomp on any existing Mocha functionality", function(){
            const test = new Test('foo', ()=>{})

            should.not.exist(test._before)
            should.not.exist(test.fn._callsBefores)
         })

         it("wraps the existing test-body function", function(){
            const body = new Function
                , test = new Test('foo', body)
            test.fn.should.equal(body)

            test.enableBefores()
            test.fn.should.not.equal(body)
         })

         it("doesn't wrap the body multiple times", function(){
            const test = new Test('foo', ()=>{})

            test.enableBefores()
            const original_wrapper = test.fn

            test.enableBefores()
            test.fn.should.equal(original_wrapper)
         })

         describe("The wrapped test", function(){
            it("calls the original test-body in the absence of hooks", function(){
               const body = sinon.spy()
                   , test = new Test('foo', body)

               test.enableBefores()
               test.fn.should.not.equal(body)
               test.fn()
               body.should.have.been.calledOnce
            })

            it("passes arguments along to the original test-body", function(){
               const body = sinon.spy()
                   , test = new Test('foo', body)
                   , arg = new Object

               test.enableBefores()
               test.fn.should.not.equal(body)
               test.fn(arg)
               body.should.have.been.calledOnce
               body.should.have.been.calledWithExactly(arg)
            })

            it("calls the original test-body with the same context", function(){
               const body = sinon.spy()
                   , test = new Test('foo', body)
                   , ctx = new Object

               test.enableBefores()
               test.fn.should.not.equal(body)
               test.fn.call(ctx)
               body.should.have.been.calledOnce
               body.should.have.been.calledOn(ctx)
            })

            it("causes added before-hooks to be called", function(){
               const body = sinon.spy()
                   , hook = sinon.spy()
                   , test = new Test('foo bar', body)

               test.beforeThis(hook)
               test._before.should.include(hook)

               test.fn()
               hook.should.have.been.calledOnce
            })

            it("calls multiple before-hooks", function(){
               const body = sinon.spy()
                   , first = sinon.spy(), second = sinon.spy()
                   , test = new Test('foo bar', body)

               test.beforeThis(first)
               test.beforeThis(second)
               test._before.should.include(first)
               test._before.should.include(second)

               test.fn()
               first.should.have.been.calledOnce
               second.should.have.been.calledOnce
            })

            it("calls multiple asynchronous before-hooks *sequentially*", function(done){
               const body = sinon.spy()
                   , test = new Test('foo bar', body)
               var called = false

               const first = sinon.spy(function first(){ return new Promise((resolve, reject) => {
                  debug("First promise called")
                  setTimeout(function(){
                     debug("First promise resolving")
                     called = true
                     resolve(called)
                  }, 25)
               }) })

               const second = sinon.spy(function second(){
                  debug("Second promise called")
                  called.should.be.true
               })

               debug("Registering hooks")
               test.beforeThis(first)
               test.beforeThis(second)

               const rv = test.fn()
               rv.should.be.an.instanceof(Promise)
               rv.then(result => {
                  first.should.have.been.calledOnce
                  second.should.have.been.calledOnce
               }).should.notify(done)
            })

            it("still calls the original body after any hooks", function(){
               const body = sinon.spy()
                   , hook = sinon.spy()
                   , test = new Test('foo', body)

               test.beforeThis(hook)
               test.fn()
               body.should.have.been.calledOnce
            })

            it("returns synchronously if there are no hooks", function(){
               const body = sinon.stub().returns()
                   , test = new Test('foo', body)

               test.enableBefores()
               const rv = test.fn()
               should.not.exist(rv)
            })

            it("returns synchronously when all hooks are synchronous", function(){
               const body = sinon.stub().returns()
                   , first = sinon.stub().returns()
                   , second = sinon.stub().returns()
                   , test = new Test('foo', body)

               test.beforeThis(first)
               test.beforeThis(second)
               const rv = test.fn()
               should.not.exist(rv)
            })

            it("still returns asynchronously when the body is asynch", function(){
               const body = sinon.stub().resolves()
                   , first = sinon.stub().returns()
                   , second = sinon.stub().returns()
                   , test = new Test('foo', body)

               test.beforeThis(first)
               test.beforeThis(second)
               const rv = test.fn()
               should.exist(rv)
               should.exist(rv.then)
               return rv.should.be.fulfilled
            })

            it("retains the return-value of the body with synchronous hooks", function(){
               const value = new Object
                   , body = sinon.stub().returns(value)
                   , hook = sinon.spy()
                   , test = new Test('foo', body)

               test.beforeThis(hook)
               const rv = test.fn()
               should.exist(rv)
               rv.should.equal(rv)
            })

            it("still returns the synchronous return-value of the body when it becomes asynch", function(){
               const value = new Object
                   , body = sinon.stub().returns(value)
                   , first = sinon.stub().resolves()
                   , second = sinon.stub().resolves()
                   , test = new Test('foo', body)

               test.beforeThis(first)
               test.beforeThis(second)
               const rv = test.fn()
               return rv.should.eventually.be.equal(value)
            })
         })


      })
      describe("Test::needsDir()", function(){
         var sandbox

         beforeEach( ()=> sandbox = sinon.sandbox.create() )
         afterEach ( ()=> sandbox.restore()                )

         it("exists", function(){
            const test = new Test()

            should.exist(test.needsDir)
         })

         it("doesn't throw", function(){
            const test = new Test('foo', ()=>{})

            ~function(){ test.needsDir() }.should.not.throw()
         })

         it("throws when there is no test body", function(){
            const test = new Test()

            ~function(){ test.needsDir() }.should.throw()
         })

         it("doesn't stomp on any existing Mocha functionality", function(){
            const test = new Test('foo', ()=>{})

            should.not.exist(test.slug)
            should.not.exist(test.fn._callsBefores)
         })

         it("enables before-hooks", function(){
            const test = new Test('foo', ()=>{})
                , enableBefores = sinon.spy(test, 'enableBefores')

            test.needsDir()
            enableBefores.should.have.been.calledOnce
         })

         it("generates an identifier-slug for the test", function(){
            const test = new Test('foo bar', ()=>{})

            test.needsDir()
            test.should.have.property('slug', 'foo-bar')
         })

         it.skip("adds a before-hook specific to the test", function(){
            const test = new Test('foo', ()=>{})

            test.needsDir()
            test._before.should.not.be.empty()
         })

         describe("The before-hook", function(){
            it.skip("...", function(){
               const test = new Test('foo', ()=>{})

               test.needsDir()
            })
         })
      })
   })
})

setTimeout(()=> run(), 0)
