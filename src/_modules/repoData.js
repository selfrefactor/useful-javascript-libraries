const { get } = require('axios')
const { takeLast, pick, multiline } = require('rambdax')

async function repoData(input) {
  try {
    const splitted = input.split('/')
    if (splitted.length !== 5) return false
    const [ owner, repo ] = takeLast(2, splitted)

    const url = multiline(`
      https://api.github.com
      repos
      ${ owner }
      ${ repo }?access_token=${ process.env.GITHUB }  
    `, '/')

    const { status, data } = await get(url)
    if (status > 200) return false
    console.log({
      owner,
      repo,
    })

    const packageJsonUrl = multiline(`
      https://api.github.com
      repos
      ${ owner }
      ${ repo }
      contents
      package.json?access_token=${ process.env.GITHUB }  
    `, '/')

    let isLibrary
    try {
      await get(packageJsonUrl)
      isLibrary = true
    } catch (e){
      isLibrary = false
    }

    const picked = pick(
      'language,name,description,html_url,updated_at,stargazers_count,open_issues',
      data
    )

    return {
      ...picked,
      isLibrary,
    }
  } catch (error) {
    return false
  }
}

exports.repoData = repoData
