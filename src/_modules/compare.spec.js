/**
 * @jest-environment node
 */
const {compare} = require('./compare')
const {repoData} = require('./repoData')
const {sortBy} = require('rambdax')


test('', async () => {
  const firstURL = 'https://github.com/selfrefactor/rambda'
  const secondURL = 'https://github.com/styled-components/css-to-react-native'

  const firstData = await repoData(firstURL)
  const secondData = await repoData(secondURL)
  const sorted = sortBy(compare, [firstData, secondData])
  expect(
    sorted[0]
  ).toEqual(firstData)
})