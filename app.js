var http = require("http");
var express = require("express");
var bodyParser = require("body-parser");
var errorHandler = require("errorhandler");
var expressJWT = require("express-jwt");
var COMFIG = require("./app/config");

var app = express();
app.locals.pretty = true;
app.set("port", process.env.PORT || 8000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(require("stylus").middleware({ src: __dirname + "/app/public" }));
app.use(express.static(`${COMFIG.ROOT_PATH}/public`));

var dbHost = process.env.DB_HOST || "localhost";
var dbPort = process.env.DB_PORT || 27017;
var dbName = process.env.DB_NAME || "vitae";
var dbURL = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
if (app.get("env") == "live") {
  // prepend url with authentication credentials //
  dbURL = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@" + dbHost + ":" + dbPort + "/" + dbName;
}

require("./app/server/routes")(app);

http.createServer(app).listen(app.get("port"), function() {
  console.log("Express server listening on port " + app.get("port"));
});
