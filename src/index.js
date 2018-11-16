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
  sortBy,
  template,
  uniqWith,
} from 'rambdax'
import {toGithubURL} from './_modules/toGithubURL'
import {repoData} from './_modules/repoData'
import {compare} from './_modules/compare'
import {titleCase} from 'string-fn'

const SECONDARY_INPUT = `${__dirname}/gist.json`
const SECONDARY_OUTPUT = `${__dirname}/linksSecondary.txt`
const LINKS = `${__dirname}/links.json`
const REPO_DATA = `${__dirname}/repoData.json`
const TITLE = '# Useful Javascript libraries\n\n'
const OTHER_TITLE = '# Other libraries\n\n'
const TEMPLATE = [
    '## [{{title}}]({{url}})',
    '> {{description}}',
  ].join('\n\n')

const TEMPLATE_NO_DESC = '## [{{title}}]({{url}})'

s()

function generateLinks(bookmarksContent){
  const allLinks = bookmarksContent.split('\n')
    .s(reject(includes('gist.')))
    .s(reject(includes('?tab')))
    .s(reject(includes('trending')))
    .s(filter(
      x => x.includes('github.com') || x.includes('npmjs'))
    )

    const withCorrectLinks = await mapAsync(async x => {
      return x.includes('github.com') ? 
        x :
        toGithubURL(x)
    })(allLinks)

    return withCorrectLinks.map(
      x => {
        const replaced = replace(/(git:)|(ssh:)/, 'https:', x)
  
        return remove('git@', replaced)
      }
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
  const linksSecondary = await generateLinks(bookmarksContentSecondary)
  
  writeJSONSync(
    LINKS,
    {links, linksSecondary}
  )
}

export async function createScores(){
  const {links, linksSecondary} = readJSONSync(LINKS)
  const withRepoDataRaw = await mapAsync(repoData(x),links)
  const withRepoDataSecondaryRaw = await mapAsync(repoData(x),linksSecondary)
  const withRepoData = withRepoDataRaw.filter(Boolean)
  const withRepoDataSecondary = withRepoDataSecondaryRaw.filter(Boolean)

  const score = withRepoData.map(getScore)
  const scoreSecondary = withRepoDataSecondary.map(
    x => getScore(x, true)
  )

  writeJSONSync(
    REPO_DATA,
    {repoData: [...score, ...scoreSecondary]}
  )
}

export async function updateSecondary(){
  const {links} = readJSONSync(SECONDARY_INPUT)
  const out = mapAsync(
    async url => {
      const {data} = await get(url)
      return data
    }
  )(links)

  const allLinks = flatten(links)
  writeFileSync(
    SECONDARY_OUTPUT, )
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

async function populate({createData, createReadme, score, updateSecondary}){
  if(updateSecondary) await updateSecondary()
  if(createData) await createDataJSON()
  if(score) await createScores()
  if(!createReadme) return

  const {repoData} = readJSONSync(REPO_DATA)
  const sorted = sortBy(prop('score'), repoData)
  const soUniq = uniqWith(
    (a,b) => a.name === b.name, 
    sorted
  )

  const jsLibs = soUniq.filter(x => x.language === 'javascript')
  const otherLibs = soUniq.filter(x => x.language !== 'javascript')
  
  const jsContent = createReadmePartial(jsLibs)
  const otherContent = createReadmePartial(otherLibs)
 
  writeFileSync(
    `${process.cwd()}/README.md`,
    `${TITLE}${jsContent}/n---/n${OTHER_TITLE}${otherContent}`
  )
}

populate({
  updateSecondary: true,
  createData: false,
  score: false,
  createReadme: false,
}).then(console.log).catch(consoele.log)