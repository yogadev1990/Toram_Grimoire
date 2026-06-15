require.extensions['.svg'] = function (module, filename) {
  module.exports = ''
}

global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  location: {
    href: '',
    pathname: ''
  }
}

const path = require('path')
const { createJiti } = require('jiti')

const jiti = createJiti(__filename, {
  alias: {
    '@': path.resolve(__dirname, './')
  }
})

jiti('./api-server.ts')
