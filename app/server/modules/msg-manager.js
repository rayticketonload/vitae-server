var crypto = require('crypto');
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var moment = require('moment');
var IDM = require('./ids-manager');
var ObjectId = require('mongodb').ObjectId;

/*
	ESTABLISH DATABASE CONNECTION
*/
var dbName = process.env.DB_NAME || 'vitae';
var dbHost = process.env.DB_HOST || 'localhost';
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(
  dbName,
  new Server(dbHost, dbPort, {
    auto_reconnect: true,
  }), {
    w: 1,
  },
);

db.open(function (e, d) {
  if (e) {
    console.log(e);
  } else {
    if (process.env.NODE_ENV == 'live') {
      db.authenticate(process.env.DB_USER, process.env.DB_PASS, function (
        e,
        res,
      ) {
        if (e) {
          console.log('mongo :: error: not authenticated', e);
        } else {
          console.log(
            'mongo :: authenticated and connected to database :: "' +
            dbName +
            '"',
          );
        }
      });
    } else {
      console.log(
        'mongo :: connected to database :: "' +
        dbName +
        '" :: collection :: msg',
      );
    }
  }
});
var msg = db.collection('msg');

/**
 * 查询当前用户所有消息
 * @param {*} user_id
 * @param {*} callback
 */
function getUserAllMsg(user_id, callback) {
  msg
    .find({
      user_id: user_id,
    }, {
      user_id: 0,
    })
    .toArray(function (e, res) {
      if (e) callback(e);
      else callback(null, res);
    });
}
exports.getUserAllMsg = getUserAllMsg;

/**
 * 增加消息
 * @param {object} data
 * user_id: "创建人",
 * msg_create_time: "消息创建时间",
 * del: "是否被用户逻辑删除",
 * cook_book: "菜谱名",
 * cook_book_url: "菜谱链接",
 * item_id: "物品ID", 
 * item_name: "物品名称",
 * item_create_date: "物品创建时间",
 * item_expire_date: "物品过期时间",
 * item_remind_date: "物品提醒时间",
 * currentLocationName: "物品所在地点名称",
 * currentLocationID: "物品所在地点ID",
 * @param {function} callback
 */
function addMsg(data, callback) {
  IDM.getNextSequence("msgid", function (err, result) {
    if (data.length <= 0) {
      callback(null, data);
      return;
    }
    msg.insert(data, {
      safe: true
    }, function (err, result) {
      if (callback) callback(err, data);
    });

  });
}
exports.addMsg = addMsg;

/**
 * 更新信息的逻辑删除状态
 * @param {*} data
 * del: "",
 * @param {*} callback
 */
function deleteMsgById(data, callback) {
  msg.findOne({
      user_id: data.user_id,
      _id: ObjectId(data.id),
    },
    function (e, o) {
      if (e) {
        callback(e);
        return;
      } else {
        if (!o) {
          callback('没有这条信息');
          return;
        }

        o.del = true;

        msg.save(
          o, {
            safe: true,
          },
          function (e) {
            if (e) callback(e);
            else
              callback(null, {
                del: '删除成功',
              });
          },
        );
      }
    },
  );
};
exports.deleteMsgById = deleteMsgById;