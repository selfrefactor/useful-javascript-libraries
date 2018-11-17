const dayjs = require('dayjs')

function dateDiff(a, b) {
  const date1 = dayjs(a)
  const date2 = dayjs(b)

  return date2.diff(date1, 'day')
}

exports.dateDiff = dateDiff
