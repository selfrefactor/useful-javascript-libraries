const {takeLast, pick, multiline} = require('rambdax')
const { get } = require('axios')

async function repoData(input){
  try {
    const splitted = input.split('/')
    if(splitted.length !== 5) return false
    const [owner, repo] = takeLast(2,splitted)
    
    const url = multiline(`
      https://api.github.com
      repos
      ${owner}
      ${repo}?access_token=${process.env.GITHUB}  
    `, '/')

    const {status,data} = await get(url)
    if(status>200) return false
    console.log({owner, repo})
    return pick(
      'language,name,description,html_url,updated_at,stargazers_count,open_issues',
      data
    )
  } catch (error) {
    return false
  }
}


exports.repoData = repoData