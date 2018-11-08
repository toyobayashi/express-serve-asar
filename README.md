# express-serve-asar

A Node.js Express middleware for serving static files inside Electron's asar file. Also works with webpack-dev-server.

## Usage

``` js
const serveAsar = require('express-serve-asar')
const devServer = require('webpack-dev-server')
const webpack = require('webpack')
const path = require('path')
const webpackConfig = require('./somewhere/webpack.config.js')
const compiler = webpack(webpackConfig)

const host = 'localhost'
const port = 3000

const contentBase = path.join(__dirname, 'public')
const customResponseHeaders = {
  'X-My-Header': '233'
}
/**
 * @param {string=} contentBase [Optional] Where the static files is served. Default value is process.cwd().
 * @param {object=} customResponseHeaders [Optional] Custom response headers
 */
const middleware = serveAsar(contentBase, customResponseHeaders)

const devServerOptions = {
  stats: {
    colors: true 
  },
  hot: true,
  inline: true,
  host,
  contentBase,
  before (app) {
    app.use(middleware)
  }
}

devServer.addDevServerEntrypoints(webpackConfig, devServerOptions)

const server = new devServer(compiler, devServerOptions)
server.listen(port, host, () => {
  console.log('webpack server start.')
})
```
