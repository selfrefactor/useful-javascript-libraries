require('env')('special')
const {
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
s()
const { bookmarksToLinks } = require('./_modules/bookmarksToLinks')
const { getScore } = require('./_modules/getScore')
const { repoData: repoDataModule } = require('./_modules/repoData')
const { titleCase } = require('string-fn')
const { toGithubURL } = require('./_modules/toGithubURL')

const BOOKMARKS = `${ __dirname }/links.txt`
const SECONDARY_INPUT = `${ __dirname }/gists.json`
const SECONDARY_OUTPUT = `${ __dirname }/linksSecondary.txt`
const LINKS = `${ __dirname }/links.json`
const REPO_DATA = `${ __dirname }/repoData.json`
const TITLE = '# {{num}} Useful Javascript libraries\n\n'
const TITLE_PROJECTS = '# {{num}} Useful Javascript projects\n\n'
const OTHER_TITLE = '# {{num}} Other libraries and resources\n\n'
const TEMPLATE = [
  '## [{{title}}]({{url}})',
  '> {{description}}',
].join('\n\n')

const TEMPLATE_NO_DESC = '## [{{title}}]({{url}})'

async function generateLinks(bookmarksContent) {
  const allLinks = bookmarksContent
    .split('\n')
    .s(reject(includes('gist.')))
    .s(reject(includes('?tab')))
    .s(reject(includes('trending')))
    .s(
      filter(x => x.includes('github.com') || x.includes('npmjs'))
    )
  //.s(take(11))

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

  writeJSONSync(LINKS, {
    links,
    linksSecondary,
  })
}

async function createScores() {
  const { links, linksSecondary } = readJSONSync(LINKS)
  const withRepoDataRaw = await mapAsync(repoDataModule, links)
  const withRepoDataSecondaryRaw = await mapAsync(
    repoDataModule,
    linksSecondary
  )

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

  writeJSONSync(REPO_DATA, { repoData : [ ...score, ...scoreSecondary ] })
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
  const jsLibs = jsRelated.filter(prop('isLibrary'))
  const jsProjects = jsRelated.filter(complement(prop('isLibrary')))
  const otherLibs = soUniq.filter(complement(isJS))

  const jsContent = createReadmePartial(jsLibs)
  const jsProjectsContent = createReadmePartial(jsProjects)
  const otherContent = createReadmePartial(otherLibs)

  const jsTitle = template(TITLE, { num : jsLibs.length })
  const jsProjectsTitle = template(TITLE_PROJECTS, { num : jsProjects.length })
  const otherTitle = template(OTHER_TITLE, { num : otherLibs.length })

  writeFileSync(
    `${ process.cwd() }/README.md`,
    `${ jsTitle }${ jsContent }\n---\n${ jsProjectsTitle }${ jsProjectsContent }---\n${ otherTitle }${ otherContent }`
  )
}

populate({
  bookmarks        : true,
  fromSelfrefactor : false,
  updateSecondary  : false,
  createData       : false,
  score            : false,
  createReadme     : false,
})
  .then(console.log)
  .catch(console.log)
