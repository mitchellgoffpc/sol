const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')


module.exports = {
    mode: process.env.NODE_ENV || 'production',
    devtool: 'source-map',
    stats: { colors: true },

    entry: './src/index.js',
    output: {
         path: path.resolve(__dirname, 'build'),
         publicPath: "",
         filename: 'app.bundle.js' },

    resolve: {
        extensions: ['.js'],
        modules: ['./src', './node_modules'] },

    module: {
        rules: [
            { test: /worker\.js$/,
              use: ['worker-loader'] },
            { test: /\.js$/,
              exclude: /node_modules/,
              use: ['babel-loader'] },
            { test: /\.css$/,
              use: ['style-loader', 'css-loader'] }]},

    performance: { hints: false },
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' })],

    devServer: {
        historyApiFallback: true,
        static: {
            directory: path.resolve(__dirname, "build") }}}
