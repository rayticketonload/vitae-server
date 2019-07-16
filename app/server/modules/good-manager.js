/*
	ESTABLISH DATABASE CONNECTION
*/
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var IDM = require('./ids-manager');
var moment = require('moment');

var dbName = process.env.DB_NAME || 'vitae';
var dbHost = process.env.DB_HOST || 'localhost';
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(
  dbName,
  new Server(dbHost, dbPort, {
    auto_reconnect: true,
  }),
  {
    w: 1,
  },
);
db.open(function(e, d) {
  if (e) {
    // console.log(e);
  } else {
    if (process.env.NODE_ENV == 'live') {
      db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(
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
          '" :: collection :: goods',
      );
    }
  }
});

var goods = db.collection('goods');
/**
 * 新增物品
 */
exports.addGood = function(data, callback) {
  goods.findOne(
    {
      $and: [
        {
          name: data.name,
          user_id: data.user_id,
          parent_id: data.parent_id,
        },
      ],
    },
    function(e, o) {
      if (o) {
        callback('已有相同的物品名');
      } else {
        addGood(data, callback);
      }
    },
  );
};

/**
 * 获取物品信息
 * @param {*} data
 * @param {*} callback
 */
exports.getGoodInfoById = function(data, callback) {
  goods.findOne(
    {
      user_id: data.user_id,
      id: data.id,
    },
    {
      _id: 0,
      name: 1,
      pic_address: 1,
      expire_date: 1,
      date: 1,
      parent_id: 1,
      id: 1,
      type: 1,
      quantity: 1,
      remind_date: 1,
      current_location_name: 1,
      current_location_id: 1,
    },
    function(e, res) {
      if (e) callback(e);
      else callback(null, res);
    },
  );
};

/**
 * 获取盒子內所有物品列表
 * @param {*} data
 * @param {*} callback
 */
exports.getListById = function(data, callback) {
  var obj = {
    user_id: data.user_id,
    parent_id: data.parent_id,
  };
  goods
    .find(obj, {
      user_id: 0,
      _id: 0,
    })
    .toArray(function(e, res) {
      if (e) callback(e);
      else callback(null, res);
    });
};

/**
 * 增加物品
 * @param {object} data
 * user_id:"创建人",
 * name: "名",
 * type: "good",
 * parent_id:'',
 * id:'',
 * pic_address:[],
 * expire_date:"过期时间"
 * date:"创建日期"
 * @param {function} callback
 */
function addGood(data, callback) {
  IDM.getNextSequence('goodid', function(err, result) {
    data.id = result.value.seq.toString();
    data.type = 'good';
    data.date = moment().format('YYYY-MM-DD HH:mm:ss');
    data.create_timestamp = moment().format('x');
    data.update_timestamp = moment().format('x');
    goods.insertOne(data, function(err, result) {
      if (callback) callback(err, data);
    });
  });
}

/**
 * 根据盒子数组，获取盒子数组中每个盒子的物品总和。
 * @param {*} data
 * user_id
 * packList :[]
 * @param {*} callback
 */
exports.getUserAllPackListByPackList = function(data, callback) {
  if (!data.user_id) callback('请提供 user id');
  //查询当前用户所有物品
  getUserAllGoodList(data.user_id, function(err, res) {
    var packList = data.packList;
    var list = [];
    if (res.length > 0) {
      var idx = 0;
      do {
        for (var i in res) {
          if (packList[idx].id === res[i].parent_id) {
            list.push(res[i]);
          }
        }
        idx++;
      } while (packList.length > idx);
    }
    callback(null, list);
  });
};

/**
 * 查询当前用户所有物品
 * @param {*} user_id
 * @param {*} callback
 */
function getUserAllGoodList(user_id, callback) {
  goods
    .find(
      {
        user_id: user_id,
      },
      {
        user_id: 0,
        _id: 0,
      },
    )
    .toArray(function(e, res) {
      if (e) callback(e);
      else callback(null, res);
    });
}
exports.getUserAllGoodList = getUserAllGoodList;

/**
 * 批量删除物品
 * @param {Object} data
 * * @param {Array} data.list
 * * @param {String} data.user_id
 * @param {*} callback
 */
exports.deleteGoodByList = (data, callback) => {
  goods.remove(
    {
      id: {
        $in: data.list,
      },
      user_id: data.user_id,
    },
    function(err, data) {
      if (err) callback(err);
      else callback(null, data);
    },
  );
};

exports.delSingleItemById = (data, callback) => {
  goods.remove(
    {
      id: data.id,
      user_id: data.user_id,
    },
    function(err, data) {
      if (err) callback(err);
      else callback(null, data);
    },
  );
};

/**
 * 搜索 根据类型及关键字 获取物品列表
 * @param {Object} data
 * @param {String} data.key
 */
exports.search = data =>
  new Promise((resolve, reject) => {
    goods
      .find(
        {
          name: {
            $regex: data.key,
            $options: 'i',
          },
          user_id: data.user_id,
        },
        {
          user_id: 0,
          _id: 0,
          good_children: 0,
          pack_children: 0,
        },
      )
      .toArray((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
  });

/**
 * 更新物品信息
 * @param {*} data
 * user_id:"",
 * id:'',
 * name:''
 * @param {*} callback
 */
exports.updateGoodInfo = function(data, callback) {
  goods.findOne(
    {
      user_id: data.user_id,
      id: data.id,
    },
    function(e, o) {
      if (e) {
        callback(e);
        return;
      } else {
        if (!o) {
          callback('没有这个物品');
          return;
        }

        o.quantity = data.quantity;
        o.remind_date = data.remind_date;
        o.name = data.name;
        o.parent_id = data.parent_id;
        o.pic_address = data.pic_address;
        o.expire_date = data.expire_date;
        o.update_timestamp = moment().format('x');
        o.current_location_name = data.current_location_name;
        o.current_location_id = data.current_location_id;

        //
        goods.save(
          o,
          {
            safe: true,
          },
          function(e) {
            if (e) callback(e);
            else
              callback(null, {
                name: o.name,
                parent_id: o.parent_id,
                pic_address: o.pic_address,
                quantity: o.quantity,
                remind_date: o.remind_date,
                expire_date: o.expire_date,
                id: o.id,
                type: o.type,
                date: o.date,
                create_timestamp: o.create_timestamp,
                current_location_name: o.current_location_name,
                current_location_id: o.current_location_id,
              });
          },
        );
      }
    },
  );
};
