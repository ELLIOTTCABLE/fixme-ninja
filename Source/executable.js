/* @flow */
import ninja from "./fixme-ninja.js"

import Debug from "debug"
const debug = Debug('fixme-ninja:executable')

export default async function executable(): Promise {
   await ninja(process.argv[2])
}
