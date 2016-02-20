import { should, sinon } from './support.js'

import Debug from 'debug'
const debug = Debug('fixme-ninja:tests')

import ninja from '../Source/fixme-ninja.js'
import { executable, support } from '../Source/fixme-ninja.js'

import Git from 'nodegit'
import Kit from 'nodegit-kit'

describe("ninja", function(){

   it("exists", function(){
      should.exist(ninja)
   })

}) // ninja
describe("Support", function(){
   describe("find_fixmes()", function(){
      const find_fixmes = support.find_fixmes

      it("exists", function(){
         should.exist(find_fixmes)
      })

      it("doesn't throw", function(){
         ~function(){ find_fixmes('')              }.should.not.throw()
         ~function(){ find_fixmes('abc')           }.should.not.throw()
         ~function(){ find_fixmes('whee a FIXME:') }.should.not.throw()
      })

      it("returns an Array", function(){
         const rv = find_fixmes('')
         should.exist(rv)
         rv.should.be.an('array')
      })

      it("includes the index of a FIXME", function(){
         find_fixmes('FIXME:').should.include(0)
      })

      it("includes the index of multiple FIXMEs", function(){
         find_fixmes(
            "FIXME: This\n"+
            "FIXME: That"
         ).should.eql([0, 12])
      })

   }) // find_fixmes()
   describe("is_bare()", function(){
      const is_bare = support.is_bare

      it("exists", function(){
         should.exist(is_bare)
      })

      it("doesn't throw", function(){
         const repo = Git.Repository.open(this.runnable().dir)
         ~function(){ is_bare(repo) }.should.not.throw()
      }).setup('git init')

      it("returns a Promise", function(){
         const repo = Git.Repository.open(this.runnable().dir)

         const rv = is_bare(repo)
         should.exist(rv)
         should.exist(rv.then)
      }).setup('git init')

      it("resolves", function(){
         return Git.Repository.open(this.runnable().dir)
            .then(repo => {
               return is_bare(repo).should.be.fulfilled
            })
      }).setup('git init')

      it("resolves to false in a normal repository", function(){
         return Git.Repository.open(this.runnable().dir)
            .then(repo => is_bare(repo).should.eventually.be.false )
      }).setup('git init')

      it("resolves to true in a bare repository", function(){
         return Git.Repository.open(this.runnable().dir)
            .then(repo => is_bare(repo).should.eventually.be.true )
      }).setup('git init --bare')

      it("resolves to null in a repository missing the config-key", function(){
         return Git.Repository.open(this.runnable().dir)
            .then(repo => is_bare(repo).should.eventually.be.null )
      }).setup('git init', 'rm .git/config')

   }) // is_bare()
}) // Support
