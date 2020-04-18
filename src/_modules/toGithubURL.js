const { last, path, remove } = require('rambdax')
const { exec } = require('helpers-fn')

const execCommand = async command => {
  const [execOutput] = await exec({command,  cwd : process.cwd() })
  return execOutput
}

async function toGithubURL(url) {
  const packageKey = last(url.split('/'))
  const command = `npm info --json ${ packageKey }`
  const packageInfoRaw = await execCommand(command)
  const packageInfo = JSON.parse(packageInfoRaw)
  
  if(packageInfo.error){
    console.log(packageKey, 'with error')
    return
  }
  const repoRaw = path('repository.url', packageInfo)
  if (!repoRaw) return false

  return remove([ 'git+', '.git' ], repoRaw)
}

exports.toGithubURL = toGithubURL
