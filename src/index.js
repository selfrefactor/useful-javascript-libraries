require('env')('special')
import {readFileSync, writeFileSync} from 'fs'
import {
  filter, 
  includes, 
  mapAsync, 
  reject, 
  remove, 
  replace, 
  s, 
  sort,
  template,
  uniqWith,
} from 'rambdax'
import {toGithubURL} from './_modules/toGithubURL'
import {repoData} from './_modules/repoData'
import {compare} from './_modules/compare'
import {titleCase} from 'string-fn'

const TITLE = '# Useful Javascript libraries\n\n'
const TEMPLATE = [
    '## [{{title}}]({{url}})',
    '> {{description}}',
  ].join('\n\n')

const TEMPLATE_NO_DESC = '## [{{title}}]({{url}})'

s()
void async function populate(){
  const bookmarksContent = readFileSync(
    `${__dirname}/links.txt`
  ).toString()

  const allLinks = bookmarksContent.split('\n')
    .s(reject(includes('gist.')))
    .s(reject(includes('?tab')))
    .s(reject(includes('trending')))
    .s(filter(
      x => x.includes('github.com') || x.includes('npmjs'))
    )

  let counter = 0    
  const withCorrectLinks = await mapAsync(async x => {
    console.log({I: counter++})

    return x.includes('github.com') ? 
      x :
      toGithubURL(x)
  })(allLinks)  

  const normalized = withCorrectLinks.map(
    x => {
      const replaced = replace(/(git:)|(ssh:)/, 'https:', x)

      return remove('git@', replaced)
    }
  )

  const withRepoDataRaw = await mapAsync(
    async x => {
      console.log({J: counter++})

      return repoData(x)
    }, 
    normalized
  )
  const withRepoData = withRepoDataRaw.filter(Boolean)

  const sorted = sort(compare, withRepoData)
  const soUniq = uniqWith(
    (a,b) => a.name === b.name, 
    sorted
  )
  console.log({sorted: sorted.length})  
  console.log({soUniq: soUniq.length})  
  const content = soUniq.map(
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

  writeFileSync(
    `${process.cwd()}/README.md`,
    `${TITLE}${content}`
  )

}()