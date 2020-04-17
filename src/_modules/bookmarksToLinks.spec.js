const { bookmarksToLinks } = require('./bookmarksToLinks')
const { BOOKMARKS } = require('../constants.js')

test('happy', async () => {
  const result = await bookmarksToLinks(BOOKMARKS)
  console.log(result)
})
