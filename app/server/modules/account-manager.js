var crypto = require("crypto");
var MongoDB = require("mongodb").Db;
var Server = require("mongodb").Server;
var moment = require("moment");

/*
	ESTABLISH DATABASE CONNECTION
*/

var dbName = process.env.DB_NAME || "vitae";
var dbHost = process.env.DB_HOST || "localhost";
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, { auto_reconnect: true }), { w: 1 });
db.open(function(e, d) {
  if (e) {
    console.log(e);
  } else {
    if (process.env.NODE_ENV == "live") {
      db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
        if (e) {
          console.log("mongo :: error: not authenticated", e);
        } else {
          console.log('mongo :: authenticated and connected to database :: "' + dbName + '"');
        }
      });
    } else {
      console.log('mongo :: connected to database :: "' + dbName + '" :: collection :: accounts');
    }
  }
});

var accounts = db.collection("accounts");

exports.autoLogin = function(user, pass, callback) {
  accounts.findOne({ user: user }, function(e, o) {
    if (o) {
      o.pass == pass ? callback(o) : callback(null);
    } else {
      callback(null);
    }
  });
};

/**
 * 查找是否有 openid ，如果用返回 数据
 * @param {*} openid
 * @param {*} callback
 */
exports.wxManualLogin = function(openid, callback) {
  accounts.findOne({ openid: openid }, function(e, o) {
    if (o == null) {
      callback("openid-not-found");
    } else {
      callback(null, o);
    }
  });
};

/**
 * 新建用户
 * @param {*} newData
 * @param {*} callback
 */
exports.wxAddNewAccount = function(newData, callback) {
  accounts.findOne({ openid: newData.openid }, function(e, o) {
    if (o) {
      callback("username-taken");
    } else {
      accounts.findOne({ email: newData.email }, function(e, o) {
        saltAndHash(newData.pass, function(hash) {
          newData.pass = hash;
          newData.date = moment().format("YYYY-MM-DD HH:mm:ss");
          accounts.insert(newData, { safe: true }, callback);
        });
      });
    }
  });
};

/**
 * 查找用户信息
 * @param {String} user_id
 * @param {Function} callback
 */
exports.getAccountByUserId = function(id, callback) {
  return new Promise((resolve, reject) => {
    accounts.findOne({ user_id: id }, { openid: 0, name: 0, email: 0, user_id: 0, pass: 0, country: 0, _id: 0 }, function(e, o) {
      if (callback) callback(e, o);
      else resolve(o);
    });
  });
};

/**
 * 更新用户信息
 * @param {*} newData
 * @param {*} callback
 */
exports.updateAccount = function(newData, callback) {
  accounts.findOne({ user_id: newData.user_id }, function(e, o) {
    o.default_pack = newData.default_pack || o.default_pack;
    o.default_pack_name = newData.default_pack_name || o.default_pack_name;
    o.name = newData.name || o.name;
    o.email = newData.email || o.email;
    o.country = newData.country || o.country;
    accounts.save(o, { safe: true }, function(e) {
      if (e) callback(e);
      else callback(null, o);
    });
  });
};

var generateSalt = function() {
  var set = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
  var salt = "";
  for (var i = 0; i < 10; i++) {
    var p = Math.floor(Math.random() * set.length);
    salt += set[p];
  }
  return salt;
};

var md5 = function(str) {
  return crypto
    .createHash("md5")
    .update(str)
    .digest("hex");
};

var saltAndHash = function(pass, callback) {
  var salt = generateSalt();
  callback(salt + md5(pass + salt));
};

var validatePassword = function(plainPass, hashedPass, callback) {
  var salt = hashedPass.substr(0, 10);
  var validHash = salt + md5(plainPass + salt);
  callback(null, hashedPass === validHash);
};

var getObjectId = function(id) {
  return new require("mongodb").ObjectID(id);
};

var findById = function(id, callback) {
  accounts.findOne({ _id: getObjectId(id) }, function(e, res) {
    if (e) callback(e);
    else callback(null, res);
  });
};

var findByMultipleFields = function(a, callback) {
  // this takes an array of name/val pairs to search against {fieldName : 'value'} //
  accounts.find({ $or: a }).toArray(function(e, results) {
    if (e) callback(e);
    else callback(null, results);
  });
};
