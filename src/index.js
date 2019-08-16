const app = require('http').createServer()
const io = require('socket.io')(app)
const { PORT } = require('./config');

const moment = require('moment')
const { findWhere } = require('underscore')
const redisConf = require('./config').redis
const Redis = require('redis')
const redis = Redis.createClient(redisConf.port, redisConf.host)
const { Message, User } = require('./db')

app.listen(PORT, () => {
  console.log(`App start... liste on ${PORT}...`)
})

// 组装 message
function createMessage(from, to, data, msg_type='text') {
  message = {
    from,
    to,
    msg_type,
    data,
    // 默认当前时间
    send_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  }
  return message
}

io.on('connection', socket => {
  const { userId } = socket.handshake.query;
  // 此处也可 on setId
  if (!userId) throw new Error('缺少userId参数')
  // 验证是否 User
  User.findOne({
    attributes: ['account'],
    where: {
      account: userId,
    }
  }).then(user => {
    if (!user) throw new Error('此用户不存在')

    // redis设置用户在线的socket.id
    redis.set(userId, socket.id);
    const meSocket = findWhere(io.sockets.sockets, {id: socket.id})
    console.log(`${userId} connect ...`)

    // 获取离线消息
    Message.findAll({
      where: {
        to: userId,
      },
      order: [
        ['send_time', 'DESC']
      ],
      raw: true
    }).then(messages => {
      if (messages !== []) {
        // 格式化时间
        messages.forEach(item => item.send_time = moment(item.send_time).format('YYYY-MM-DD HH:mm:ss'))
        // 同步离线消息
        meSocket.emit('enter', messages)
        // 删除数据库中离线消息
        Message.destroy({
          where: {
            to: userId
          }
        })
      }
    })

    // 发送消息
    socket.on('message', msg => {
      const toId = msg.to;
      const message = createMessage(userId, toId, msg.data)
      redis.get(toId, (err, id) => {
        if (id === null) {
          User.findOne({
            attributes: ['account'],
            where: {
              account: toId
            }
          }).then(user => {
            if (!user) throw new Error('接收方用户不存在')
            redis.set(toId, 'offline')
            // 保存离线数据
            Message.create(message)
          }).catch(err => {
            throw new Error(err)
          })
        }
        if (id === 'offline') {
          // 保存离线数据
          Message.create(message)
        } else {
          const toSocket = findWhere(io.sockets.sockets, {id})
          if (toSocket) {
            toSocket.emit('message', message)
          }
        }
        meSocket.emit('message', message)
      })
    })

    
  }).catch(err => {
    throw new Error(err)
  })

  socket.on('disconnect', function() {
    console.log(`${userId} disconnect ...`)
    // 设置离线状态
    redis.set(userId, 'offline')
  })
})

