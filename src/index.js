require('env')('special')
import { get } from 'axios'
import { readFileSync, writeFileSync } from 'fs'
import { writeJSONSync, readJSONSync } from 'fs-extra'
import {
  anyTrue,
  complement,
  filter,
  flatten,
  includes,
  map,
  mapAsync,
  prop,
  reject,
  remove,
  replace,
  s,
  sortBy,
  take,
  template,
  uniqWith,
} from 'rambdax'
import { toGithubURL } from './_modules/toGithubURL'
import { repoData as repoDataModule } from './_modules/repoData'
import { getScore } from './_modules/getScore'
import { titleCase } from 'string-fn'

const SECONDARY_INPUT = `${ __dirname }/gists.json`
const SECONDARY_OUTPUT = `${ __dirname }/linksSecondary.txt`
const LINKS = `${ __dirname }/links.json`
const REPO_DATA = `${ __dirname }/repoData.json`
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
    //.s(take(11))

  const withCorrectLinks = await mapAsync(async x => {
    if (x.includes('github.com')) return x
    const url = await toGithubURL(x)

    return url
  }, allLinks)

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
    `${ __dirname }/links.txt`
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
    {
      links,
      linksSecondary,
    }
  )
}

export async function createScores(){
  const { links, linksSecondary } = readJSONSync(LINKS)
  const withRepoDataRaw = await mapAsync(repoData, links)
  const withRepoDataSecondaryRaw = await mapAsync(
    repoDataModule,
    linksSecondary
  )

  const withRepoData = withRepoDataRaw.filter(Boolean)
  const withRepoDataSecondary = withRepoDataSecondaryRaw
    .filter(Boolean)

  const score = withRepoData.map(
    x => ({
      ...x,
      score : getScore(x, true),
    })
  )
  const scoreSecondary = withRepoDataSecondary.map(
    x => ({
      ...x,
      score : getScore(x, true),
    })
  )

  writeJSONSync(
    REPO_DATA,
    { repoData : [ ...score, ...scoreSecondary ] }
  )
}

async function updateSecondary(){
  const { links } = readJSONSync(SECONDARY_INPUT)
  const out = await mapAsync(
    async url => {
      const { data } = await get(url)

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
        description : x.description ? x.description.trim() : '',
        title       : titleCase(x.name),
        url         : x.html_url,
      }
      const templated = x.description ?
        template(TEMPLATE, templateInput) :
        template(TEMPLATE_NO_DESC, templateInput)

      return `${ templated }\n`
    }
  ).join('\n')
}

function isJS(x){
  if (x.language === null) return false

  return anyTrue(
    x.language.toLowerCase() === 'javascript',
    x.language.toLowerCase() === 'typescript'
  )
}

async function populate({ createData, createReadme, score, update }){
  if (update) await updateSecondary()
  if (createData) await createDataJSON()
  if (score) await createScores()
  if (!createReadme) return

  const { repoData } = readJSONSync(REPO_DATA)
  const sorted = sortBy(prop('score'), repoData)
  const soUniq = uniqWith(
    (a, b) => a.name === b.name,
    sorted
  )

  const jsLibs = soUniq.filter(isJS)
  const otherLibs = soUniq.filter(complement(isJS))

  const jsContent = createReadmePartial(jsLibs)
  const otherContent = createReadmePartial(otherLibs)

  const jsTitle = template(TITLE, { num : jsLibs.length })
  const otherTitle = template(OTHER_TITLE, { num : otherLibs.length })

  writeFileSync(
    `${ process.cwd() }/README.md`,
    `${ jsTitle }${ jsContent }\n---\n${ otherTitle }${ otherContent }`
  )
}

populate({
  update       : false,
  createData   : false,
  score        : false,
  createReadme : true,
}).then(console.log)
  .catch(console.log)
