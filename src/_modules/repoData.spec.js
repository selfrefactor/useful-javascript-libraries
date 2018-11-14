/**
 * @jest-environment node
 */
const {isAttach} = require('rambdax')
const {repoData} = require('./repoData')
isAttach()

const schema = {
  description: 'string',
  html_url: 'string',
  updated_at: 'string',
  stargazers_count: 'number',
  open_issues: 'number'
}

test('', async () => {
  const url = 'https://github.com/selfrefactor/rambda'

  const data = await repoData(url)
  console.log({data})
  expect(
    data.is(schema)
  ).toBe(true)
})