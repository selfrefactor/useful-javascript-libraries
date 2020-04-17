const axios = require('axios')
const { dateDiff } = require('../_helpers/dateDiff')
const { getDependencies } = require('../_helpers/getDependencies')
const { takeLast, pick, glue, path } = require('rambdax')

const ALLOWED_UPDATED_DAYS = 180

function safeIncludes(list, target){
  if (!Array.isArray(list)) return false

  return list.includes(target)
}

async function getGithubData({ owner, repo }){
  const url = `https://api.github.com/repos/${ owner }/${ repo }`

  const { status, data } = await axios({
    method  : 'get',
    url,
    timeout : 1000,
    headers : { Authorization : `token ${ process.env.GITHUB }` },
  })

  return {
    status,
    data,
  }
}

async function getDependencyData({ owner, repo }){
  const url = `https://api.github.com/repos/${ owner }/${ repo }/contents/package.json`

  let isLibrary
  let isAngular = false
  let isTypescript = false
  let dependencies

  try {
    const response = await axios({
      method  : 'get',
      url,
      timeout : 1000,
      headers : { Authorization : `token ${ process.env.GITHUB }` },
    })
    dependencies = getDependencies(path('data.content', response))

    if (safeIncludes(dependencies, '@angular/core')){
      isAngular = true
    } else if (safeIncludes(dependencies, 'typescript')){
      isTypescript = true
    }
    isLibrary = true
  } catch (e){
    isLibrary = false
  }

  return {
    isLibrary,
    isTypescript,
    isAngular,
    dependencies,
  }
}

async function repoData(input, secondaryFlag){
  try {
    const splitted = input.split('/')
    if (splitted.length !== 5) return false
    const [ owner, repo ] = takeLast(2, splitted)

    const { status, data } = await getGithubData({
      owner,
      repo,
    })
    if (status > 200) return false

    const { isLibrary, isTypescript, isAngular } = await getDependencyData({
      owner,
      repo,
    })

    const picked = pick('language,name,description,html_url,updated_at,stargazers_count,open_issues',
      data)

    if (secondaryFlag){
      const updatedSince = dateDiff(data.updated_at, Date.now())
      console.log({ okUpdated : updatedSince < ALLOWED_UPDATED_DAYS })

      if (updatedSince > ALLOWED_UPDATED_DAYS) return false
    }

    console.log({
      owner,
      repo,
      isLibrary,
      isAngular,
      isTypescript,
    })

    return {
      ...picked,
      isLibrary,
      isAngular,
      isTypescript,
    }
  } catch (e){
    return false
  }
}

exports.module = module
exports.getGithubData = getGithubData
exports.getDependencyData = getDependencyData
exports.repoData = repoData
exports.repoDataSecondary = x => repoData(x, true)
