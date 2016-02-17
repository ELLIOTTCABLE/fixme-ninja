import { should } from './support.js'

import ninja from '../'

describe("fixme-ninja", function(){
   describe("ninja()", function(){
      this.eachNeeds("git init")

      it("exists", function(){
         should.exist(ninja)
      })

      // FIXME: This needs to get a directory allocated, but without `git init` ...
      // FIXME: This shouldn't pass.
      it("throws in a directory with no repository", function(){
         ninja('.')
      }).cd()

      it("doesn't throw on an empty repository", function(){
         console.log(process.cwd())
         ninja('.')
      })
      .needs()

   })
})

//describe("Meta", function(){
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
//})

setTimeout(()=> run(), 0)
