const { titleCase } = require('./titleCase.js')

test('happy', () => {
  expect(titleCase('Public-APIs')).toBe('Public Apis')
})

test('1', () => {
  expect(titleCase('FileSaver.js')).toBe('File Saver Js')
})

test('2', () => {
  expect(titleCase('PWABuilder-CLI')).toBe('Pwabuilder Cli')
})
 