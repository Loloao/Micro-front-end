const router = require('koa-router')()

router.prefix('/react16')

router.post('/login', function (ctx, next) {
  ctx.body = 'sdfsdf'
})

module.exports = router