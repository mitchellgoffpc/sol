var path = require('path')
var webpack = require('webpack')

module.exports = {
    entry: './src/index.js',
    output: {
         path: path.resolve(__dirname, 'build'),
         publicPath: "/assets/",
         filename: 'app.bundle.js' },

    resolve: {
        extensions: ['.js'],
        modules: ['./src', './node_modules'] },

    module: {
        loaders: [
            { test: /\.js$/,
              loader: 'babel-loader',
              query: {
                  presets: ['es2015'],
                  plugins: [
                      'transform-do-expressions',
                      'transform-class-properties' ]}}]},

    stats: { colors: true },
    devtool: 'source-map' }
