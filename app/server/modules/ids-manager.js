/**
 *
 * 控制mongodb 的自增ID
 */

var MongoDB = require("mongodb").Db;
var Server = require("mongodb").Server;
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
      console.log('mongo :: connected to database :: "' + dbName + '" :: collection :: ids');
    }
  }
});

var ids = db.collection("ids");

//自增扩展
exports.getNextSequence = function getNextSequence(name, cb) {
  ids.findAndModify({ _id: name }, [["seq", "asc"]], { $inc: { seq: 1 } }, { new: true, upsert: true }, cb);
};
