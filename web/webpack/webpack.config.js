const path = require('path');
const webpack = require('webpack');

const {
  HotModuleReplacementPlugin,
  NoEmitOnErrorsPlugin,
  EnvironmentPlugin
} = webpack;
const ManifestPlugin = require('webpack-manifest-plugin');
const InterpolateHtmlPlugin = require('interpolate-html-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ErrorOverlayPlugin = require('error-overlay-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const babelConfig = require('../babel.config');
const manifestSeed = require('../src/manifest.json');

require('dotenv-flow').config({ default_node_env: 'development' });

module.exports = {
  plugins: [
    new HotModuleReplacementPlugin(),
    new NoEmitOnErrorsPlugin(),
    new ErrorOverlayPlugin(),
    new EnvironmentPlugin(process.env),
    new ManifestPlugin({
      seed: manifestSeed
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '..', 'src', 'index.html')
    }),
    new InterpolateHtmlPlugin(process.env),
    new CopyPlugin([{ from: 'src/favicon.png', to: 'favicon.png' }])
  ],
  entry: ['./src/bootstrap.ts'],
  output: {
    path: path.resolve(__dirname, '..', 'build'),
    filename: '[name].[hash].js',
    publicPath: '/'
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: {
          loader: 'eslint-loader',
          options: {
            fix: false,
            cache: true,
            configFile: '.eslintrc.yml'
          }
        }
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: babelConfig
          },
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelConfig
        }
      },
      {
        test: /\.(svg|png|jpg)$/,
        use: 'file-loader'
      }
    ]
  }
};
