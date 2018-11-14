import {readFileSync} from 'fs'
import { map, reject, includes, filter, startsWith, s, remove } from 'rambdax'
s()

void async function populate(){
  const bookmarksContent = readFileSync(
    `${process.cwd()}/links.txt`
  ).toString()

  const y = bookmarksContent.split('\n')
    .s(reject(includes('gist.')))
    .s(reject(includes('?tab')))
    .s(reject(includes('trending')))
    .s(filter(
      x => x.includes('github.com') || x.includes('npmjs'))
    )
  console.log({y})
  console.log({y: y.length})
}()