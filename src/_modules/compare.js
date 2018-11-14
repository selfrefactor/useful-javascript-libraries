const { dateDiff } = require('../_helpers/dateDiff')

const UPDATED = 6
const  ISSUES = 9
const STARS = 1

function compare(a,b){
  const updated = dateDiff(b.updated_at, a.updated_at)*UPDATED
  const issues = Math.floor(b.open_issues - a.open_issues)*ISSUES
  const stars = Math.floor(a.stargazers_count - b.stargazers_count)*STARS

  const total = updated + issues + stars

  return total
}

exports.compare = compare