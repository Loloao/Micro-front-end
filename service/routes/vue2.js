const router = require('koa-router')()

router.prefix('/vue2')

router.get('/car/list', function (ctx, next) {
  ctx.body = [
    {id: 1, name: '比亚迪'},
    {id: 2, name: '特斯拉'},
    {id: 3, name: '长城'},
  ]
})

router.get('/bar', function (ctx, next) {
  ctx.body = 'this is a users/bar response'
})

module.exports = router