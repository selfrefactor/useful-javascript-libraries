const { dateDiff } = require('./dateDiff')

test('same day', () => {
  const a = '2018-11-12T13:51:57Z'
  const b = '2018-11-12T02:25:47Z'

  expect(dateDiff(a, b)).toBe(0)
})

test('b is better', () => {
  const a = '2018-11-12T13:51:57Z'
  const b = '2018-10-12T02:25:47Z'

  expect(dateDiff(a, b)).toBeLessThan(-27)
})

test('a is better', () => {
  const a = '2018-09-12T13:51:57Z'
  const b = '2018-10-12T02:25:47Z'

  expect(dateDiff(a, b)).toBeGreaterThan(27)
})
