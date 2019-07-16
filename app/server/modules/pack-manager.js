var crypto = require("crypto");
var MongoDB = require("mongodb").Db;
var Server = require("mongodb").Server;
var moment = require("moment");
var IDM = require("./ids-manager");

/*
	ESTABLISH DATABASE CONNECTION
*/
var dbName = process.env.DB_NAME || "vitae";
var dbHost = process.env.DB_HOST || "localhost";
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {
  auto_reconnect: true
}), {
  w: 1
});
db.open(function (e, d) {
  if (e) {
    console.log(e);
  } else {
    if (process.env.NODE_ENV == "live") {
      db.authenticate(process.env.DB_USER, process.env.DB_PASS, function (e, res) {
        if (e) {
          console.log("mongo :: error: not authenticated", e);
        } else {
          console.log('mongo :: authenticated and connected to database :: "' + dbName + '"');
        }
      });
    } else {
      console.log('mongo :: connected to database :: "' + dbName + '" :: collection :: packs');
    }
  }
});

var packs = db.collection("packs");

/**
 * 新建一个包
 * @param {object} newData
 * user_id:"创建人",
 * name: "包名",
 * type: "package",
 * parent_id:'',
 * good_children:[],
 * pack_children:[] ,
 * date:"创建日期"
 * @param {function} callback
 *
 */
exports.wxAddNewPack = function (data, callback) {
  packs.findOne({
    $and: [{
      name: data.name,
      user_id: data.user_id,
      parent_id: data.parent_id
    }]
  }, function (e, o) {
    if (o) {
      callback("存放位置内已有同名盒子，请改用其他名字", 102);
    } else {
      addPack(data, callback);
    }
  });
};

/**
 * 根据ID获取盒子信息
 * @param {object} data
 * user_id:"",
 * id:'',
 * @param {function} callback
 */
exports.getPackInfoById = function (data, callback) {
  packs.findOne({
    user_id: data.user_id,
    id: data.id
  }, {
    user_id: 0,
    _id: 0,
    good_children: 0,
    pack_children: 0
  }, function (
    e,
    res
  ) {
    if (e) callback(e);
    else callback(null, res);
  });
};

/**
 * 根据ID获取盒子內所有盒子列表
 * @param {object} data
 * user_id:"",
 * parent_id:'',
 * @param {function} callback
 *
 */
exports.getListById = function (data, callback) {
  var obj = {
    user_id: data.user_id,
    parent_id: data.parent_id
  };
  packs.find(obj, {
    user_id: 0,
    _id: 0,
    good_children: 0,
    pack_children: 0
  }).toArray(function (e, res) {
    if (e) callback(e);
    else callback(null, res);
  });
};

/**
 * 新建默认的 家，办公室 ，仓库
 * @param {*} openid
 * @param {*} callback (err,id)
 */
exports.addNewDefaultPack = function (openid, callback) {
  var home = {
    user_id: openid,
    name: "家",
    parent_id: null
  };
  var warehouse = {
    user_id: openid,
    name: "仓库",
    parent_id: null
  };
  var office = {
    user_id: openid,
    name: "办公室",
    parent_id: null
  };
  addPack(home, callback);
  addPack(warehouse);
  addPack(office);
};

/**
 * 增加包
 * @param {object} data
 * user_id:"创建人",
 * name: "包名",
 * type: "package",
 * parent_id:'',
 * good_children:[],
 * pack_children:[] ,
 * image_path:"图片路径",
 * date:"创建日期",
 * timestamp:"创建日期_时间戳",
 * update_timestamp:"更新时间戳",
 * @param {function} callback
 */
function addPack(data, callback) {
  IDM.getNextSequence("packid", function (err, result) {
    data.id = result.value.seq.toString();
    data.good_children = [];
    data.pack_children = [];
    data.type = "package";
    data.date = moment().format("YYYY-MM-DD HH:mm:ss");
    data.create_timestamp = moment().format("x");
    data.update_timestamp = moment().format("x");
    packs.insertOne(data, function (err, result) {
      if (callback) callback(err, data);
    });
  });
}

/**
 * 获取 id盒子 下的 所有盒子（包括盒子中的盒子）
 * @param {*} data
 * user_id:"",
 * id:'',
 * @param {*} callback
 */
exports.getUserAllPackListById = function (data, callback) {
  if (!data.id) callback("请提供 pack id");
  //获取当前用户所有盒子数据
  getUserAllPackList(data.user_id, function (err, allPack) {
    var findPack = null;
    allPack.map(function (item, idx) {
      if (item.id === data.id) {
        findPack = item;
        return;
      }
    });
    //有这个ID 的盒子
    var list = [];
    if (findPack) {
      var ids = new Set([findPack.id]);
      findPack.parent_name = null; //顶级没parent_name
      list.push(findPack);
      var length = 0;
      do {
        length = ids.size;
        for (var i in allPack) {
          var pack = allPack[i];
          if (ids.has(pack.parent_id)) {
            ids.add(pack.id);

            pack.parent_name = list.filter(p => {
              if (p.id === pack.parent_id) return p;
            })[0].name;

            list.push(pack);
            delete pack;
          }
        }
      } while (ids.length > length);
    }
    callback(null, list);
  });
};

/**
 * 更新盒子信息
 * @param {*} data
 * user_id:"",
 * id:'',
 * name:''
 * @param {*} callback
 */
exports.updatePackInfo = function (data, callback) {
  packs.findOne({
    user_id: data.user_id,
    id: data.id
  }, function (e, o) {
    if (e) {
      callback(e);
      return;
    } else {
      if (!o) {
        callback("没有这个盒子");
        return;
      }
      //查父亲节点是否有效位置
      packs.findOne({
        user_id: data.user_id,
        id: data.parentId
      }, function (e, parent) {
        if (e) {
          callback(e);
          return;
        } else if (!parent && data.parentId != null) {
          callback("没有这个位置，请选择正确的存放位置!", 101);
          return;
        } else {
          //有效位置
          //查找当前parentId下是否有这个name的盒子
          packs.findOne({
            user_id: data.user_id,
            parent_id: data.parentId,
            name: data.name
          }, function (e, oo) {
            if (e) {
              callback(e);
              return;
            } else if (oo && oo.id != o.id) {
              callback("存放位置内已有同名盒子，请改用其他名字！", 102);
              return;
            } else {
              o.name = data.name;
              o.parent_id = data.parentId;
              o.image_path = data.imagePath;
              o.update_timestamp = moment().format("x");
              packs.save(o, {
                safe: true
              }, function (e) {
                if (e) callback(e);
                else
                  callback(null, {
                    name: o.name,
                    parent_id: o.parent_id,
                    image_path: o.image_path,
                    id: o.id,
                    type: o.type,
                    date: o.date,
                    create_timestamp: o.create_timestamp,
                  });
              });
            }
          });
        }
      });
    }
  });
};

/**
 * 查询当前用户的所有盒子
 * @param {*} user_id
 * @param {function} callback
 */
function getUserAllPackList(user_id, callback) {
  packs.find({
    user_id: user_id
  }, {
    user_id: 0,
    _id: 0,
    good_children: 0,
    pack_children: 0
  }).toArray(function (e, res) {
    if (e) callback(e);
    else callback(null, res);
  });
}
exports.getUserAllPackList = getUserAllPackList;

/**
 * 批量删除盒子
 * @param {Object} data
 * @param {Array} data.list
 * @param {String} data.user_id
 * @param {*} callback
 */
exports.deletePackByList = (data, callback) => {
  packs.remove({
    id: {
      $in: data.list
    },
    user_id: data.user_id
  }, function (err, data) {
    if (err) callback(err);
    else callback(null, data);
  });
};

/**
 * 搜索 根据类型及关键字 获取盒子列表
 * @param {Object} data
 * @param {String} data.key
 */
exports.search = data =>
  new Promise((resolve, reject) => {
    packs
      .find({
        name: {
          $regex: data.key,
          $options: "i"
        },
        user_id: data.user_id
      }, {
        user_id: 0,
        _id: 0,
        good_children: 0,
        pack_children: 0
      })
      .toArray((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
  });