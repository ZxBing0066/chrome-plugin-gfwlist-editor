var webpack = require('webpack');
var path = require('path');
var appRoot = path.join(__dirname, 'src');
var nodeRoot = path.join(__dirname, 'node_modules');
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    //插件项
    plugins: [
        commonsPlugin,
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: true
            }
        }),
        new ExtractTextPlugin("[name].css")
    ],
    //页面入口文件配置
    devtool: false,
    entry: {
        app: './src/app.js',
    },
    //入口文件输出配置
    output: {
        path: path.join(__dirname, './package/build/'),
        filename: './js/[name].bundle.js',
        chunkFilename: './js/[name].chunk.js',
        publicPath: '/build/'
    },
    //加载器配置
    module: {
        loaders: [{
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('css-loader')
        }, {
            test: /\.(png|jpg)$/,
            loader: 'url-loader?limit=8192'
        }, {
            test: /\.(js|jsx)$/,
            exclude: /(node_modules)/,
            loader: 'babel',
            query: {
                presets: ['react', 'es2015']
            }
        }]
    },
    //其它解决方案配置
    resolve: {
        root: [appRoot, nodeRoot], //绝对路径
        extensions: ['', '.js', '.jsx', '.html'],
        alias: {
            config: path.join(__dirname, './src/js/config.js'),
        }
    }
};
