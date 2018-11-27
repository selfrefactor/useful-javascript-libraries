const { toGithubURL } = require('./toGithubURL')

test('', async () => {
  const from = 'https://www.npmjs.com/package/rambda'
  const to = 'https://github.com/selfrefactor/rambda'

  expect(await toGithubURL(from)).toBe(to)
})
