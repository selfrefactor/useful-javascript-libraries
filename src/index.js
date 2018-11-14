require('env')('special')
import {readFileSync, writeFileSync} from 'fs'
import {replace, template ,mapAsync, mapFastAsync, take, remove, reject, includes, filter, s, sort } from 'rambdax'
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

const normalized = [ 'https://github.com/parro-it/screen-info',
'https://github.com/jonschlinkert/markdown-toc',
'https://github.com/jonschlinkert/remarkable',
'https://github.com/dominikwilkowski/cfonts',
'https://github.com/oblador/react-native-vector-icons',
'https://github.com/jefflau/jest-fetch-mock',
// 'https://github.com/emazzotta/lighthouse-badges',
// 'https://github.com/dainis/node-gcstats',
// 'https://github.com/zeit/release',
// 'https://github.com/isaacs/node-which',
// 'https://github.com/lydell/json-stringify-pretty-compact',
// 'https://github.com/kss-node/kss-node',
// 'https://github.com/hapijs/cryptiles',
// 'https://github.com/lydell/json-stringify-pretty-compact',
// 'https://github.com/dainis/node-gcstats',
// 'https://github.com/kss-node/kss-node',
// 'https://github.com/zeit/release',
// 'https://github.com/isaacs/node-which',
// 'https://github.com/wix/redux-saga-tester',
// 'https://github.com/AlexGilleran/jsx-control-statements',
// 'https://github.com/millermedeiros/disparity',
// 'https://github.com/developit/snarkdown',
// 'https://github.com/alexjoverm/tslint-config-prettier',
// 'https://github.com/redux-observable/redux-observable/blob/master/package.json',
// 'https://github.com/AhsanSN/Meme-Viewer',
// 'https://github.com/medikoo/cli-color',
// 'https://github.com/sindresorhus/cli-spinners/blob/master/package.json',
// 'https://github.com/skidding/react-testing-examples/tree/master/tests/jest-enzyme',
// 'https://github.com/Nozbe/WatermelonDB/tree/master/src/utils/fp',
// 'https://github.com/atelierbram/Base2Tone-VSCode-Themes/tree/master/themes' 
]

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
    .s(take(10))
      
  const withCorrectLinks = await mapFastAsync(async x => {
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

  const withRepoDataRaw = await mapFastAsync(repoData, normalized)
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