const WORDS = /[A-Z]?[a-z]+|[A-Z]?[A-Za-z]?[A-Za-z]+/g
const { join, match, map, head, toUpper, toLower, tail } = require('rambdax')

function words(str){
  return match(WORDS, str)
}

function titleCase(str){
  return join(
    ' ',
    map(val => `${ toUpper(head(val)) }${ toLower(tail(val)) }`, words(str))
  )
}

exports.titleCase = titleCase
