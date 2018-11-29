const { getDependencies } = require('./getDependencies')
const { isAttach } = require('rambdax')
isAttach()

test('', () => {
  const dependencies = getDependencies(getData())
  console.log(dependencies)

  expect(dependencies.is([ 'string' ])).toBe(true)
})

function getData() {
  return `ewogICJuYW1lIjogInNob3BwaW5nLWNhcnQtZGVza3RvcC1hcHAiLAogICJ2\nZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiQSBtZW1lIHZp\nZXdpbmcgZGVza3RvcCBhcHAiLAogICJtYWluIjogImFwcC5qcyIsCiAgInNj\ncmlwdHMiOiB7CiAgICAic3RhcnQiOiAiRWxlY3Ryb24gIC4iCiAgfSwKICAi\na2V5d29yZHMiOiBbCiAgICAiRWxlY3Ryb24iLAogICAgInF1aWNrIiwKICAg\nICJzdGFydCIsCiAgICAidHV0b3JpYWwiLAogICAgImRlbW8iCiAgXSwKICAi\nYXV0aG9yIjogIlN5ZWQgQWhzYW4gQWhtZWQiLAogICJsaWNlbnNlIjogIkND\nMC0xLjAiLAogICJkZXZEZXBlbmRlbmNpZXMiOiB7CiAgICAiZWxlY3Ryb24i\nOiAiXjIuMC4wIgogIH0sCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJnb29n\nbGUtaW1hZ2VzIjogIl4yLjEuMCIsCiAgICAiZ29vZ2xlYXBpcyI6ICJeMS4w\nLjAiLAogICAgInNxbGl0ZTMiOiAiXjMuMS44IgogIH0KfQo=\n`
}
