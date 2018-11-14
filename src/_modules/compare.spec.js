/**
 * @jest-environment node
 */
const {compare} = require('./compare')
const {repoData} = require('./repoData')
const {sort} = require('rambdax')

const first = {
  updated_at: '2018-11-12T13:51:57Z',
  stargazers_count: 37,
  open_issues: 0
}
const second = {
  updated_at: '2018-11-01T07:41:55Z',
  stargazers_count: 183,
  open_issues: 9
}
const third = {
  updated_at: '2018-09-14T07:41:55Z',
  stargazers_count: 407,
  open_issues: 30
}

test('first is better', () => {
  expect(
    compare(first, second)
  ).toBeGreaterThan(0)
})

test('second is better', () => {
  expect(
    compare(second, third)
  ).toBeGreaterThan(0)
})

test('', async () => {
  const firstURL = 'https://github.com/selfrefactor/rambda'
  const secondURL = 'https://github.com/styled-components/css-to-react-native'

  const firstData = await repoData(firstURL)
  const secondData = await repoData(secondURL)
  const sorted = sort(compare, [firstData, secondData])
  expect(
    sorted[0]
  ).toEqual(secondData)
})