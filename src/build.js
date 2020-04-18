const { envFn } = require('env-fn')
envFn('special')

const {
  allTrue,
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
  sort,
  template,
  uniqWith,
} = require('rambdax')
const {
  repoData: repoDataModule,
  repoDataSecondary,
} = require('./_modules/repoData')
const { bookmarksToLinks } = require('./_modules/bookmarksToLinks')
const { get } = require('axios')
const { getScore } = require('./_modules/getScore')
const { readFileSync, writeFileSync } = require('fs')
const { titleCase } = require('./_helpers/titleCase.js')
const { toGithubURL } = require('./_modules/toGithubURL')
const { writeJSONSync, readJSONSync } = require('fs-extra')

const BOOKMARKS = `${ __dirname }/links.txt`
const SECONDARY_INPUT = `${ __dirname }/gists.json`
const SECONDARY_OUTPUT = `${ __dirname }/linksSecondary.txt`
const LINKS = `${ __dirname }/links.json`
const REPO_DATA = `${ __dirname }/repoData.json`
const TITLE = '# {{num}} Useful {{tag}} libraries\n\n'
const AWESOME_TITLE = '# {{num}} Useful {{tag}}\n\n'
const TITLE_PROJECTS = '# {{num}} Useful Javascript projects\n\n'
const OTHER_TITLE = '# {{num}} Other libraries and resources\n\n'
const TEMPLATE = [ '## [{{title}}]({{url}})', '> {{description}}' ].join('\n\n')

const TEMPLATE_NO_DESC = '## [{{title}}]({{url}})'
s()

async function createDataJSON(){
  const links = (readFileSync(BOOKMARKS).toString()).split('\n').filter(Boolean)

  const linksSecondary = (readFileSync(SECONDARY_OUTPUT).toString()).split('\n')
  .filter(x => x.startsWith('https://github.com/'))
  .filter(x => x.split('/').length === 5)
  .filter(x => !x.includes('selfrefactor'))

  writeJSONSync(
    LINKS,
    {
      links,
      linksSecondary,
    },
    { spaces : '\t' }
  )
}

async function createScores(){
  const { links, linksSecondary } = readJSONSync(LINKS)
  const withRepoDataRaw = await mapAsync(repoDataModule, links)
  const withRepoDataSecondaryRaw = await mapAsync(repoDataSecondary,
    linksSecondary)

  const withRepoData = withRepoDataRaw.filter(Boolean)
  const withRepoDataSecondary = withRepoDataSecondaryRaw.filter(Boolean)

  const score = withRepoData.map(x => ({
    ...x,
    score : getScore(x, true),
  }))
  const scoreSecondary = withRepoDataSecondary.map(x => ({
    ...x,
    score : getScore(x, true),
  }))
  const toSave = uniqWith((a, b) => a.name === b.name, [
    ...score,
    ...scoreSecondary,
  ])

  writeJSONSync(
    REPO_DATA, { repoData : toSave }, { spaces : '\t' }
  )
}

async function updateSecondaryFn(){
  const { links } = readJSONSync(SECONDARY_INPUT)
  const out = await mapAsync(async url => {
    const { data } = await get(url)

    return data.split('\n')
  })(links)

  const allLinks = flatten(out).join('\n')
  writeFileSync(SECONDARY_OUTPUT, allLinks)
}

function createReadmePartial(list){
  return list
    .map(x => {
      const templateInput = {
        description : x.description ? x.description.trim() : '',
        title       : titleCase(x.name),
        url         : x.html_url,
      }
      const templated = x.description ?
        template(TEMPLATE, templateInput) :
        template(TEMPLATE_NO_DESC, templateInput)

      return `${ templated }\n`
    })
    .join('\n')
}

function isJS(x){
  if (x.language === null) return false

  return anyTrue(x.language.toLowerCase() === 'javascript',
    x.language.toLowerCase() === 'typescript')
}

async function updateFromSelfrefactor(){
  const base = 'https://api.github.com/users/selfrefactor'
  const starsUrl = `${ base }/starred`
  const watchesUrl = `${ base }/subscriptions`
  const { data: stars } = await get(starsUrl)
  const { data: watches } = await get(watchesUrl)

  const links = [ ...stars, ...watches ].map(prop('html_url')).join('\n')
  const bookmarks = readFileSync(BOOKMARKS).toString()

  writeFileSync(BOOKMARKS, `${ bookmarks }\n${ links }`)
}

function isLibrary(library){
  return allTrue(
    prop('isLibrary', library),
    prop('isAngular', library) === false,
    prop('isTypescript', library) === false
  )
}

function isAwesomeRepo({ name }){
  return name.toLowerCase().startsWith('awesome-')
}

async function populate({
  bookmarks,
  createData,
  createReadme,
  score,
  updateSecondary,
  fromSelfrefactor,
}){
  if (bookmarks) bookmarksToLinks(BOOKMARKS)
  if (fromSelfrefactor) await updateFromSelfrefactor()
  if (updateSecondary) await updateSecondaryFn()
  if (createData) await createDataJSON()
  if (score) await createScores()
  if (!createReadme) return
  
  const { repoData } = readJSONSync(REPO_DATA)
  const sorted = sort((a, b) => b.score - a.score, repoData)
  const reposRaw = uniqWith((a, b) => a.name === b.name, sorted)
  const awesomeRepos = reposRaw.filter(isAwesomeRepo)
  const repos = reject(isAwesomeRepo, reposRaw)

  const jsRelated = repos.filter(isJS)
  const jsLibs = jsRelated.filter(isLibrary)
  const angularLibs = jsRelated.filter(prop('isAngular'))
  const tsLibs = jsRelated.filter(prop('isTypescript'))
  const jsProjects = jsRelated.filter(complement(prop('isLibrary')))
  const otherLibs = repos.filter(complement(isJS))

  const jsContent = createReadmePartial(jsLibs)
  const awesomeContent = createReadmePartial(awesomeRepos)
  const angularContent = createReadmePartial(angularLibs)
  const tsContent = createReadmePartial(tsLibs)
  const jsProjectsContent = createReadmePartial(jsProjects)
  const otherContent = createReadmePartial(otherLibs)

  const jsTitle = template(TITLE, {
    num : jsLibs.length,
    tag : 'Javascript',
  })
  const awesomeTitle = template(AWESOME_TITLE, {
    num : awesomeRepos.length,
    tag : 'Awesome lists',
  })
  const angularTitle = template(TITLE, {
    num : angularLibs.length,
    tag : 'Angular',
  })
  const tsTitle = template(TITLE, {
    num : tsLibs.length,
    tag : 'Typescript',
  })
  const jsProjectsTitle = template(TITLE_PROJECTS, { num : jsProjects.length })
  const otherTitle = template(OTHER_TITLE, { num : otherLibs.length })

  const sep = '---\n\n'
  const js = `${ jsTitle }${ jsContent }`
  const angular = `${ sep }${ angularTitle }${ angularContent }`
  const ts = `${ sep }${ tsTitle }${ tsContent }`
  const awesome = `${ sep }${ awesomeTitle }${ awesomeContent }`
  const projects = `${ sep }${ jsProjectsTitle }${ jsProjectsContent }`
  const other = `${ sep }${ otherTitle }${ otherContent }`

  writeFileSync(`${ process.cwd() }/README.md`,
    `${ js }\n${ awesome }${ angular }${ ts }${ projects }${ other }`)
}

populate({
  bookmarks        : 0,
  fromSelfrefactor : 0,
  updateSecondary  : 0,
  createData       : 0,
  score            : 0,
  createReadme     : 1,
})
  .then(console.log)
  .catch(console.log)
