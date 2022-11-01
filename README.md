# Micro-front-end

本工程用于学习微前端底层原理

## 构建子工程

`build/run.js`以一个脚本启动全部子工程

### 后端应用
通过 koa-generator 构建一个 koa 后端应用接收请求
使用 supervisor 自动重启应用
使用 koa2-cors 解决跨域问题
