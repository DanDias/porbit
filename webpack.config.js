var path = require('path')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var BrowserSyncPlugin = require('browser-sync-webpack-plugin')

// Phaser webpack config
var phaser = path.join(__dirname, 'node_modules/phaser/dist/phaser.js')

var definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true'))
})

module.exports = {
  entry: {
    app: [
      path.resolve(__dirname, 'src/game.js')
    ],
    vendor: ['phaser']
  },
  devtool: 'source-map',
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    publicPath: './dist/',
    filename: 'bundle.js'
  },
  watch: true,
  optimization: {
    splitChunks: {
        cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
                name: 'vendor',
                chunks: 'all'
            }
        }
    }
  },
  plugins: [
    definePlugin,
    new HtmlWebpackPlugin({
      filename: '../index.html',
      template: './src/index.html',
      chunks: ['vendor', 'app'],
      chunksSortMode: 'manual',
      minify: {
        removeAttributeQuotes: false,
        collapseWhitespace: false,
        html5: false,
        minifyCSS: false,
        minifyJS: false,
        minifyURLs: false,
        removeComments: false,
        removeEmptyAttributes: false
      },
      hash: false
    }),
    new BrowserSyncPlugin({
      host: process.env.IP || 'localhost',
      port: process.env.PORT || 8080,
      server: {
        baseDir: ['./', './build']
      }
    })
  ],
  module: {
    rules: [
      /*{ test: /\.js$/, use: ['babel-loader'], include: path.join(__dirname, 'src') },*/
      /*{ test: /phaser-split\.js$/, use: ['expose-loader?Phaser'] }*/
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    alias: {
      'phaser': phaser
    }
  }
}
