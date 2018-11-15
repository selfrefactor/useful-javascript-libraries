require('env')('special')
import {readFileSync, writeFileSync} from 'fs'
import {replace, template ,mapAsync, remove, reject, includes, filter, s, sort } from 'rambdax'
import {toGithubURL} from './_modules/toGithubURL'
import {repoData} from './_modules/repoData'
import {compare} from './_modules/compare'
import {titleCase} from 'string-fn'

const TITLE = '# Useful Javascript libraries\n\n'
const TEMPLATE = [
    '## [{{title}}]({{html_url}})',
    '> {{description}}',
  ].join('\n\n')

const TEMPLATE_NO_DESC = '## [{{name}}]({{html_url}})'

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
    console.log({i: counter++})

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
      console.log({j: counter++})

      return repoData(x)
    }, 
    normalized
  )
  const withRepoData = withRepoDataRaw.filter(Boolean)

  const sorted = sort(compare, withRepoData)

  const content = sorted.map(
    x => {
      const templateInput = {...x, title: titleCase(x.name)}
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