/**
 * @jest-environment node
 */
const { envFn } = require('env-fn')
envFn('special')

const { pass } = require('rambdax')
const { repoData, getGithubData } = require('./repoData')

const schema = {
  description      : 'string',
  html_url         : 'string',
  updated_at       : 'string',
  stargazers_count : 'number',
  open_issues      : 'number',
}

test.skip('github', async () => {
  const result = await getGithubData({
    repo  : 'rambdax',
    owner : 'selfrefactor',
  })
  console.log({ result })
})

test.skip('happy', async () => {
  const url = 'https://github.com/selfrefactor/rambda'

  const data = await repoData(url)
  console.log({ data })
})
