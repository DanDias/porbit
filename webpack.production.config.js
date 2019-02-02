var path = require('path')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')

// Phaser webpack config
var phaser = path.join(__dirname, 'node_modules/phaser/dist/phaser.js')

var definePlugin = new webpack.DefinePlugin({
  __DEV__: false
})

module.exports = {
  entry: {
    app: ['./src/game.js', './server.js'],
    vendor: ['phaser']
  },
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    publicPath: './dist/',
    filename: 'bundle.js'
  },
  watch: true,
  optimization: {
    splitChunks: {
        chunks: 'all',
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
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        html5: false,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        removeComments: true,
        removeEmptyAttributes: true
      },
      hash: false
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
