const {takeLast, pick} = require('rambdax')
const { get } = require('axios')

async function repoData(url){
  const [owner, repo] = takeLast(2,url.split('/'))

  const {data} = await get(
    `https://api.github.com/repos/${owner}/${repo}`
  )
  return pick(
    'description,html_url,updated_at,stargazers_count,open_issues',
    data
  )
}


exports.repoData = repoData