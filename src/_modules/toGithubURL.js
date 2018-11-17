const child_process = require('child_process')
const { last, path, remove } = require('rambdax')
const { promisify } = require('util')
const exec = promisify(child_process.exec)

const execCommand = async command => {
  const { stdout } = await exec(command, { cwd : process.cwd() })

  return stdout
}

async function toGithubURL(url){
  const packageKey = last(url.split('/'))
  const command = `npm info --json ${ packageKey }`
  const packageInfoRaw = await execCommand(command)
  const packageInfo = JSON.parse(packageInfoRaw)
  const repoRaw = path('repository.url', packageInfo)
  if (!repoRaw) return false

  return remove([
    'git+',
    '.git',
  ], repoRaw)
}

exports.toGithubURL = toGithubURL
