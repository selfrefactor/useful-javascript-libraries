require('env')('special')
import {get} from 'axios'
import {readFileSync, writeFileSync} from 'fs'
import {writeJSONSync, readJSONSync} from 'fs-extra'
import {
  prop,
  filter, 
  includes, 
  mapAsync, 
  reject, 
  remove, 
  flatten,
  replace, 
  s, 
  complement,
  map,
  sortBy,
  template,
  take,
  uniqWith,
} from 'rambdax'
import {toGithubURL} from './_modules/toGithubURL'
import {repoData} from './_modules/repoData'
import {getScore} from './_modules/getScore'
import {titleCase} from 'string-fn'

const SECONDARY_INPUT = `${__dirname}/gists.json`
const SECONDARY_OUTPUT = `${__dirname}/linksSecondary.txt`
const LINKS = `${__dirname}/links.json`
const REPO_DATA = `${__dirname}/repoData.json`
const TITLE = '# {{num}} Useful Javascript libraries\n\n'
const OTHER_TITLE = '# {{num}} Other libraries and resources\n\n'
const TEMPLATE = [
    '## [{{title}}]({{url}})',
    '> {{description}}',
  ].join('\n\n')

const TEMPLATE_NO_DESC = '## [{{title}}]({{url}})'

s()

async function generateLinks(bookmarksContent){
  const allLinks = bookmarksContent.split('\n')
    .s(reject(includes('gist.')))
    .s(reject(includes('?tab')))
    .s(reject(includes('trending')))
    .s(filter(
      x => x.includes('github.com') || x.includes('npmjs'))
    )
    .s(take(11))

    const withCorrectLinks = await mapAsync(async x => {
      return x.includes('github.com') ? 
        x :
        toGithubURL(x)
    })(allLinks)


    return withCorrectLinks
      .s(filter(Boolean))
      .s(map(x => {
          const replaced = replace(/(git:)|(ssh:)/, 'https:', x)
  
          return remove('git@', replaced)
        })
      )
}

async function createDataJSON(){
  const bookmarksContent = readFileSync(
    `${__dirname}/links.txt`
  ).toString()

  const bookmarksContentSecondary = readFileSync(
    SECONDARY_OUTPUT
  ).toString()

  const links = await generateLinks(bookmarksContent)
  const linksSecondary = await generateLinks(
    bookmarksContentSecondary
  )
  
  writeJSONSync(
    LINKS,
    {links, linksSecondary}
  )
}

export async function createScores(){
  const {links, linksSecondary} = readJSONSync(LINKS)
  const withRepoDataRaw = await mapAsync(repoData,links)
  const withRepoDataSecondaryRaw = await mapAsync(
    repoData,
    linksSecondary
  )

  const withRepoData = withRepoDataRaw.filter(Boolean)
  const withRepoDataSecondary = withRepoDataSecondaryRaw
    .filter(Boolean)

  const score = withRepoData.map(
    x => ({...x, score: getScore(x, true)})
  )
  const scoreSecondary = withRepoDataSecondary.map(
    x => ({...x, score: getScore(x, true)})
  )

  writeJSONSync(
    REPO_DATA,
    {repoData: [...score, ...scoreSecondary]}
  )
}

async function updateSecondary(){
  const {links} = readJSONSync(SECONDARY_INPUT)
  const out = await mapAsync(
    async url => {
      const {data} = await get(url)

      return data.split('\n')
    }
  )(links)

  const allLinks = flatten(out).join('\n')
  writeFileSync(
    SECONDARY_OUTPUT, 
    allLinks
  )
}

function createReadmePartial(list){
  return list.map(
    x => {
      const templateInput = {
        title: titleCase(x.name),
        description: x.description ? x.description.trim() : '',
        url: x.html_url
      }
      const templated = x.description ?
          template(TEMPLATE, templateInput) :
          template(TEMPLATE_NO_DESC, templateInput)

        return `${templated}\n`  
    }
  ).join('\n')    
}

function isJS(x){
  if(x.language === null) return false

  return x.language.toLowerCase() === 'javascript' || x.language.toLowerCase() === 'typescript'
}

async function populate({createData, createReadme, score, update}){
  if(update) await updateSecondary()
  if(createData) await createDataJSON()
  if(score) await createScores()
  if(!createReadme) return

  const {repoData} = readJSONSync(REPO_DATA)
  const sorted = sortBy(prop('score'), repoData)
  const soUniq = uniqWith(
    (a,b) => a.name === b.name, 
    sorted
  )

  const jsLibs = soUniq.filter(isJS)
  const otherLibs = soUniq.filter(complement(isJS))
  
  const jsContent = createReadmePartial(jsLibs)
  const otherContent = createReadmePartial(otherLibs)
 
  const jsTitle = template(TITLE,{num:jsLibs.length})
  const otherTitle = template(OTHER_TITLE,{num:otherLibs.length})
  
  writeFileSync(
    `${process.cwd()}/README.md`,
    `${jsTitle}${jsContent}\n---\n${otherTitle}${otherContent}`
  )
}

populate({
  update: false,
  createData: false,
  score: false,
  createReadme: true,
}).then(console.log).catch(console.log)