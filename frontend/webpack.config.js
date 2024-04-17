const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

dotenv.config();

module.exports = {
    mode: "development",
    devtool: 'cheap-module-source-map',
    entry: {
        index: path.resolve('./src/app/index.jsx'),
        background: path.resolve('./src/background/background.js')
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: { presets: ['@babel/env',['@babel/preset-react', {'runtime': 'automatic'}]] }
            },
            {
                use: ['style-loader', 'css-loader'],
                test: /\.css$/
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                loader: 'file-loader',
                options: {
                  outputPath: 'images'
                }
            }
        ]
    },
    plugins: [
        new CopyPlugin({
          patterns: [
            { from: path.resolve('src/manifest.json'), to: path.resolve('dist') },
            { from: path.resolve('src/images/veeva-logo.png'), to: path.resolve('dist') }
          ],
        }),
        new HtmlWebpackPlugin({
            title: 'Vault Developer Toolbox',
            filename: 'index.html',
            chunks: ['index']
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
        }),
        new MonacoWebpackPlugin({
            languages: ['javascript']
          }),
      ],
    resolve: {
        extensions: ['*', '.js','.jsx']
    },
    output: {
        filename: '[name].js'
    }
}