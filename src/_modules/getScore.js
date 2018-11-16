const dayjs = require('dayjs')

function dateDiff(a){
  const date1 = dayjs(Date.now());
  const date2 = dayjs(a);
  
  return date2.diff(date1, 'day')
}

const UPDATED = 5
const ISSUES = 9
const STARS = 2

function  getScore(x, otherFlag){
  const updatedPenalty = dateDiff(x.updated_at)*UPDATED
  const issuesPenalty = x.open_issues*ISSUES
  const starsScore = x.stargazers_count*STARS
  const othersPenalty = otherFlag ? -10000 : 0

  return starsScore + updatedPenalty + issuesPenalty + othersPenalty
}

exports.getScore = getScore