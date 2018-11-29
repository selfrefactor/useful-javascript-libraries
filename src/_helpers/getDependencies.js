const Base64 = require('js-base64').Base64
const {
  keys,
  tryCatch,
  pick,
  mergeAll,
  s,
  values,
} = require('rambdax')
s()

function getDependencies(encodedData) {
  const packageJsonRaw = tryCatch(Base64.decode, false)(
    encodedData
  )

  if (!packageJsonRaw) return false

  const packageJson = tryCatch(JSON.parse, false)(packageJsonRaw)

  if (!packageJson) return false

  const dependencies = pick(
    'dependencies,devDependencies,peerDependencies',
    packageJson
  )

  return dependencies
    .s(values)
    .s(mergeAll)
    .s(keys)
}

exports.getDependencies = getDependencies
