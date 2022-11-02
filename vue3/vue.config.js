const path = require('path')
const {name} = require('./package')

function resolve(dir) {
  return path.join(__dirname, dir)
}

const port = 8003

module.exports = {
  outputDir: 'dist', // 打包的目录
  assetsDir: 'static', // 打包的静态文件
  filenameHashing: true, // 打包的文件，会带有 hash
  publicPath: 'http://localhost:8003',
  devServer: {
    // static: [path.join(__dirname, 'dist')],
    hot: true,
    allowedHosts: 'all',
    port,
    // 允许跨域
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },

  // 自定义 webpack 配置
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    output: {
      // 把子应用打包成 umd 库格式
      libraryTarget: 'umd',
      filename: 'vue3.[name].js',
      // 这个配置用于获取当前打包的信息，通过 window.vue2 获取子应用内容
      library: 'vue3',
      chunkLoadingGlobal: `webpackJsonp_${name}`
    }
  }
}
