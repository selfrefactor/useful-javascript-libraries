require('env')('special')
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
const { get } = require('axios')
const { readFileSync, writeFileSync } = require('fs')
const { writeJSONSync, readJSONSync } = require('fs-extra')
const { bookmarksToLinks } = require('./_modules/bookmarksToLinks')
const { getScore } = require('./_modules/getScore')
const { repoData: repoDataModule, repoDataSecondary } = require('./_modules/repoData')
const { titleCase } = require('string-fn')
const { toGithubURL } = require('./_modules/toGithubURL')

const BOOKMARKS = `${ __dirname }/links.txt`
const SECONDARY_INPUT = `${ __dirname }/gists.json`
const SECONDARY_OUTPUT = `${ __dirname }/linksSecondary.txt`
const LINKS = `${ __dirname }/links.json`
const REPO_DATA = `${ __dirname }/repoData.json`
const TITLE = '# {{num}} Useful {{tag}} libraries\n\n'
const TITLE_PROJECTS = '# {{num}} Useful Javascript projects\n\n'
const OTHER_TITLE = '# {{num}} Other libraries and resources\n\n'
const TEMPLATE = [
  '## [{{title}}]({{url}})',
  '> {{description}}',
].join('\n\n')

const TEMPLATE_NO_DESC = '## [{{title}}]({{url}})'
s()

async function generateLinks(bookmarksContent) {
  const allLinks = bookmarksContent
    .split('\n')
    .s(reject(includes('gist.')))
    .s(reject(includes('?tab')))
    .s(reject(includes('trending')))
    .s(
      filter(x => x.includes('github.com') || x.includes('npmjs'))
    )
  
  const withCorrectLinks = await mapAsync(async x => {
    if (x.includes('github.com')) return x
    const url = await toGithubURL(x)

    return url
  }, allLinks)

  return withCorrectLinks.s(filter(Boolean)).s(
    map(x => {
      const replaced = replace(/(git:)|(ssh:)/, 'https:', x)

      return remove('git@', replaced)
    })
  )
}

async function createDataJSON() {
  const bookmarksContent = readFileSync(
    BOOKMARKS
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
    { links, linksSecondary},
    {spaces:'\t'}
  )
}

async function createScores() {
  const { links, linksSecondary } = readJSONSync(LINKS)
  const withRepoDataSecondaryRaw = await mapAsync(
    repoDataSecondary,
    linksSecondary
  )
  const withRepoDataRaw = await mapAsync(repoDataModule, links)

  const withRepoData = withRepoDataRaw.filter(Boolean)
  const withRepoDataSecondary = withRepoDataSecondaryRaw.filter(
    Boolean
  )

  const score = withRepoData.map(x => ({
    ...x,
    score : getScore(x, true),
  }))
  const scoreSecondary = withRepoDataSecondary.map(x => ({
    ...x,
    score : getScore(x, true),
  }))

  writeJSONSync(
    REPO_DATA, 
    { repoData : [ ...score, ...scoreSecondary ] },
    { spaces: '\t'}
  )
}

async function updateSecondaryFn() {
  const { links } = readJSONSync(SECONDARY_INPUT)
  const out = await mapAsync(async url => {
    const { data } = await get(url)

    return data.split('\n')
  })(links)

  const allLinks = flatten(out).join('\n')
  writeFileSync(SECONDARY_OUTPUT, allLinks)
}

function createReadmePartial(list) {
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

function isJS(x) {
  if (x.language === null) return false

  return anyTrue(
    x.language.toLowerCase() === 'javascript',
    x.language.toLowerCase() === 'typescript'
  )
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
    prop('isReact', library) === false,
    prop('isTypescript', library) === false,
  )
}

async function populate({
  bookmarks,
  createData,
  createReadme,
  score,
  updateSecondary,
  fromSelfrefactor,
}) {
  if (bookmarks) bookmarksToLinks(BOOKMARKS)
  if (fromSelfrefactor) await updateFromSelfrefactor()
  if (updateSecondary) await updateSecondaryFn()
  if (createData) await createDataJSON()
  if (score) await createScores()
  if (!createReadme) return

  const { repoData } = readJSONSync(REPO_DATA)
  const sorted = sort((a, b) => b.score - a.score, repoData)
  const soUniq = uniqWith((a, b) => a.name === b.name, sorted)

  const jsRelated = soUniq.filter(isJS)
  const jsLibs = jsRelated.filter(isLibrary)
  const reactLibs = jsRelated.filter(prop('isReact'))
  const tsLibs = jsRelated.filter(prop('isTypescript'))
  const jsProjects = jsRelated.filter(complement(prop('isLibrary')))
  const otherLibs = soUniq.filter(complement(isJS))

  const jsContent = createReadmePartial(jsLibs)
  const reactContent = createReadmePartial(reactLibs)
  const tsContent = createReadmePartial(tsLibs)
  const jsProjectsContent = createReadmePartial(jsProjects)
  const otherContent = createReadmePartial(otherLibs)

  const jsTitle = template(TITLE, { num : jsLibs.length, tag: 'Javascript' })
  const reactTitle = template(TITLE, { num : reactLibs.length, tag: 'React' })
  const tsTitle = template(TITLE, { num : tsLibs.length, tag: 'Typescript' })
  const jsProjectsTitle = template(TITLE_PROJECTS, { num : jsProjects.length })
  const otherTitle = template(OTHER_TITLE, { num : otherLibs.length })

  const sep = '---\n\n'
  const js = `${ jsTitle }${ jsContent }`
  const react = `${sep}${ reactTitle }${ reactContent }`
  const ts = `${sep}${ tsTitle }${ tsContent }`
  const projects = `${sep}${ jsProjectsTitle }${ jsProjectsContent }`
  const other = `${sep}${ otherTitle }${ otherContent }`

  writeFileSync(
    `${ process.cwd() }/README.md`,
    `${ js }\n${react}${ts}${projects}${ other }`
  )
}

populate({
  bookmarks        : 0,
  fromSelfrefactor : 0,
  updateSecondary  : 0,
  createData       : 0,
  score            : 1,
  createReadme     : 0,
})
  .then(console.log)
  .catch(console.log)
