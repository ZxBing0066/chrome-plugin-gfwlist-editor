var webpack = require('webpack');
var path = require('path');
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var exec = require('child_process').exec;
var fs = require('fs');
var webpackConfig = require('./webpack.config.js');

fs.exists('./src/js/config.dev.js', function(exists) {
    if (!exists) {
        exec('cp ./src/js/config.dev.js.template ./src/js/config.dev.js');
        console.warn('config for dev is not exist, auto generated');
    }
});
webpackConfig.plugins = [
    commonsPlugin,
    new ExtractTextPlugin("[name].css"),
    new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': JSON.stringify('dev'),
        },
    })
];
webpackConfig.devtool = 'eval';
webpackConfig.resolve.alias.config = path.join(__dirname, './src/js/config.dev.js');
webpackConfig.resolve.alias.mockList = path.join(__dirname, './mock/mockList.js');
module.exports = webpackConfig;