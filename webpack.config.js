
var path = require('path');
var webpack = require('webpack');

var entry = [
  './index.js',
  'webpack-dev-server/client?http://localhost:3000',
  'webpack/hot/only-dev-server'
]

module.exports = {
  devtool: 'eval',
  entry: entry,
  output: {
    path: __dirname,
    filename: 'bundle.js',
    publicPath: ''
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      { 
				test: /\.js/, 
        include: [ 
          path.resolve(__dirname, "node_modules/medium"),
          path.resolve(__dirname, "index.js") 
        ],
				loader: 'babel-loader?stage=1&optional[]=runtime'
			}
		]
  }
};
