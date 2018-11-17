/**
 * @jest-environment node
 */
const {getScore} = require('./getScore')
const {repoData} = require('./repoData')
const {sort} = require('rambdax')

const first = {
  updated_at: '2018-11-12T13:51:57Z',
  stargazers_count: 37,
  open_issues: 0,
}
const second = {
  updated_at: '2018-11-01T07:41:55Z',
  stargazers_count: 183,
  open_issues: 9,
}
const third = {
  updated_at: '2018-09-14T07:41:55Z',
  stargazers_count: 407,
  open_issues: 30,
}

test('second is better', () => {
  const firstScore = getScore(first)
  const secondScore = getScore(second)
  console.log({firstScore, secondScore})

  expect(firstScore).toBeLessThan(secondScore)
})

test('third is better', () => {
  const secondScore = getScore(second)
  const thirdScore = getScore(third)
  // console.log({thirdScore, secondScore})

  expect(thirdScore).toBeGreaterThan(secondScore)
})

test('otherFlag has enough influence', () => {
  const firstScore = getScore(first, true)
  const thirdScore = getScore(third)
  // console.log({thirdScore, firstScore})

  expect(thirdScore).toBeGreaterThan(firstScore)
})

test.skip('', async () => {
  const firstURL = 'https://github.com/selfrefactor/rambda'
  const secondURL =
    'https://github.com/styled-components/css-to-react-native'

  const firstData = await repoData(firstURL)
  const secondData = await repoData(secondURL)
  const sorted = sort(getScore, [firstData, secondData])
  expect(sorted[0]).toEqual(secondData)
})
