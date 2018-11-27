const { readFileSync } = require('fs')
const dayjs = require('dayjs')
const { match, anyTrue, remove } = require('rambdax')

const today = dayjs().format('MM_DD_YY')
const FILE = `./src/bookmarks_${today}.html`
const GITHUB_MARKER = 'https://github.com/'
const NPM_MARKER = 'http://npmjs.com/package/'

const content = readFileSync(FILE).toString()

const matched = match(
  /href=\".+\" ICON/gmi,
  content
)

console.log({matched: matched.length})

const y = matched.filter(x => anyTrue(
  x.includes(GITHUB_MARKER),
  x.includes(NPM_MARKER),
))

console.log({y: y[0]})



const z = remove([
  'HREF="',
  /".+/g
], y[0])


console.log({z})