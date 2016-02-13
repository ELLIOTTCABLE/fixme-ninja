import Git from "nodegit"
import Debug from "debug"
const debug = Debug('fixme-ninja')

export default async function ninja(path){
   let repo = await Git.Repository.open(path)
   let HEAD = await repo.getHeadCommit()
   debug(`HEAD: ${HEAD.id().toString()}`)
}
