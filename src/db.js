const Sequelize = require('sequelize')
const mysqlUrl = require('./config').mysql
const sequelize = new Sequelize(mysqlUrl)
const { INTEGER, STRING, ENUM, BOOLEAN, DATE, NOW } = Sequelize;

const Message = sequelize.define('message', {
  // 发送方
  from: {
    type: INTEGER,
    allowNull: false
  },
  // 接收方
  to: {
    type: INTEGER,
    allowNull: false
  },
  // 消息类型
  msg_type: {
    type: ENUM('text', 'img', 'audio'),
    defaultValue: 'text',
    allowNull: false
  },
  // 消息内容
  data: {
    type: STRING(512),
    allowNull: false
  },
  // 发送时间
  send_time: {
    type: DATE,
    defaultValue: NOW(),
    allowNull: false
  }
}, {
  tableName: 'message',
  timestamps: false,
  timezone: '+08:00'
})

// 仅用于查找用户
const User = sequelize.define('user', {
  account: {
    type: STRING(32),
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  password: {
    type: STRING(256),
    allowNull: false,
  },
  nickname: {
    type: STRING(32),
    allowNull: true,
  },
  name: {
    type: STRING(16),
    allowNull: true,
  },
  avatar: {
    type: STRING(256),
    allowNull: true,
  },
  sex: {
    type: ENUM('MALE', 'FEMALE', 'SECRET'),
  },
  per_signature: {
    type: STRING(1000),
  },
  is_teacher: {
    type: BOOLEAN,
  },
  is_student: {
    type: BOOLEAN,
  },
  tutor_num: {
    type: INTEGER,
    defaultValue: 0,
  },
  student_num: {
    type: INTEGER,
    defaultValue: 0,
  },
  average_score: {
    type: INTEGER,
    defaultValue: 0,
  }
}, {
  tableName: 'user',
  timestamps: false
})

module.exports = {
  Message,
  User
}
