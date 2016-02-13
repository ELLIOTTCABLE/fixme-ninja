import ninja from "./fixme-ninja.js"

import Debug from "debug"
const debug = Debug('fixme-ninja:executable')

export default async function executable(){
   await ninja(process.argv[2])
}
