import Git from "nodegit"

export default function ninja(repo){
   Git.Repository.open(repo)
}
