var path = require("path");
exports.SECRET_KEY = "faeb4453e5d14fe6f6d04637f78077c76c73d1b4"; //加密token 校验token时要使用
exports.JWT_EXPIRES = "10h"; //以秒或表示时间跨度zeit / ms的字符串表示。如：60，"2 days"，"10h"，"7d"
exports.ROOT_PATH = path.join(__dirname, "../");

//const APPID = "wx7743f7e48f68278c"; //ethan
//const SECRET = "3972a8203778031b8fc712df99d0ad17";//ethan
const APPID = "wx3bd2ee7633c079f8"; //ray
const SECRET = "2c4d79ffe69a3b3c7d9d432e25a1cdc3"; //ray
exports.WX_CONFIG = {
  APPID: APPID,
  SECRET: SECRET
};
