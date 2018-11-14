import {readdirSync, readFileSync} from 'fs'
import rp from 'request-promise'
import { startsWith, s, remove } from 'rambdax'
s()

void async function populate(){
  const [bookmarksFile] = readdirSync(__dirname)
    .filter(startsWith('bookmarks'))

  if(!bookmarksFile) return
  const bookmarksContent = readFileSync(
    `${__dirname}/${bookmarksFile}`
  ).toString()

  const y = bookmarksContent
    .match(/HREF="[a-zA-Z:\/\.\?#]+"/g)
    .s(x => x.map(remove(/HREF="|"/g)))
  console.log({y})
}()