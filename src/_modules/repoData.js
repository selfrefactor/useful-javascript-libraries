const { get } = require('axios')
const { takeLast, pick, glue, path } = require('rambdax')
const { getDependencies } = require('../_helpers/getDependencies')

function safeIncludes(list, target) {
  if (!Array.isArray(list)) return false

  return list.includes(target)
}

async function repoData(input) {
  try {
    const splitted = input.split('/')
    if (splitted.length !== 5) return false
    const [ owner, repo ] = takeLast(2, splitted)

    const url = glue(
      `
      https://api.github.com
      repos
      ${ owner }
      ${ repo }?access_token=${ process.env.GITHUB }  
    `,
      '/'
    )

    const { status, data } = await get(url)
    if (status > 200) return false

    const packageJsonUrl = glue(
      `
      https://api.github.com
      repos
      ${ owner }
      ${ repo }
      contents
      package.json?access_token=${ process.env.GITHUB }  
    `,
      '/'
    )

    let isLibrary
    let isReact = false
    let isTypescript = false
    try {
      const response = await get(packageJsonUrl)
      const dependencies = getDependencies(
        path('data.content', response)
      )
      if (safeIncludes(dependencies, 'react')) {
        isReact = true
      } else if (safeIncludes(dependencies, 'typescript')) {
        isTypescript = true
      }
      isLibrary = true
    } catch (e) {
      isLibrary = false
    }

    const picked = pick(
      'language,name,description,html_url,updated_at,stargazers_count,open_issues',
      data
    )

    console.log({
      owner,
      repo,
      isLibrary,
      isReact,
      isTypescript,
    })

    return {
      ...picked,
      isLibrary,
      isReact,
      isTypescript,
    }
  } catch (error) {
    return false
  }
}

exports.repoData = repoData
