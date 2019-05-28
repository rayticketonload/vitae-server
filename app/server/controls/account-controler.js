var AM = require("../modules/account-manager");
var PM = require("../modules/pack-manager");
var GM = require("../modules/good-manager");

var COMFIG = require("../../config");
var https = require("https");
var jwt = require("jsonwebtoken");
var expressJWT = require("express-jwt");

/**
 *
 * 获取TOKEN
 *
 */
exports.getToken = function(req, res) {
  console.dir("code: " + req.body.code);
  if (req.body.code) {
    var openid = ""; //获取 openid session_key
    var session_key = "";
    var user = null;
    const opts = {
      hostname: "api.weixin.qq.com",
      path:
        "/sns/jscode2session?appid=" +
        COMFIG.WX_CONFIG.APPID +
        "&secret=" +
        COMFIG.WX_CONFIG.SECRET +
        "&js_code=" +
        req.body.code +
        "&grant_type=authorization_code",
      method: "GET"
    };
    var httpsReq = https.request(opts, function(r) {
      r.setEncoding("utf8");
      r.on("data", function(data) {
        var data = JSON.parse(data);
        if (data) {
          if (data.errcode === 40029 || data.openid == null) {
            res.status(200).send({
              code: 100,
              msg: data.errmsg
            });
            return;
          }
          openid = data.openid;
          session_key = data.session_key;
          //查数据库是否有 openid
          AM.wxManualLogin(openid, function(e, o) {
            if (!o) {
              // 保存 openid
              user = {
                openid: openid,
                name: openid,
                email: "",
                user_id: openid,
                pass: openid,
                country: "",
                default_pack: "", //默认首页盒子ID
                default_pack_name: "" //默认首页盒子名称
              };

              AM.wxAddNewAccount(user, function(e) {
                if (e) {
                  console.log("error: " + e);
                }
                // 新建默认的 家，办公室 ，仓库
                PM.addNewDefaultPack(openid, function(e, data) {
                  //更新 default_pack default_pack_name
                  AM.updateAccount(
                    {
                      user_id: openid,
                      default_pack: data.id,
                      default_pack_name: data.name
                    },
                    function(err, data) {}
                  );
                });
              });
            } else {
              console.log(o);
              user = o;
            }
            var token = jwt.sign(user, COMFIG.SECRET_KEY, {
              expiresIn: COMFIG.JWT_EXPIRES
            });
            console.dir("session_key: " + token);
            res.status(200).send({
              code: 200,
              session_key: token
            });
          });
        }
      });
    });

    httpsReq.on("error", function(e) {
      console.log("auth_user error: " + e.message);
    });
    httpsReq.end();
  }
};

/**
 *
 * 获取首页用户信息
 *
 */
exports.getUserInfo = function(req, res) {
  var userData = {};
  var packs = [];
  var goods = [];
  AM.getAccountByUserId(req.user.user_id, function(err, data) {
    if (data) {
      userData = data;
      //获取顶点盒子以下的所有盒子数
      PM.getUserAllPackListById({ user_id: req.user.user_id, id: data.default_pack }, function(err, data) {
        if (err)
          res.status(200).send({
            code: 100,
            msg: err
          });
        if (data && data.length > 0) {
          packs = data.concat();
          //根据盒子数组，获取盒子数组中每个盒子的物品总和。
          GM.getUserAllPackListByPackList(
            {
              user_id: req.user.user_id,
              packList: packs
            },
            function(err, data) {
              if (err)
                res.status(200).send({
                  code: 100,
                  msg: err
                });
              if (data.length > 0) {
                goods = data.concat();
              }
              console.log({
                packTotal: packs,
                goodTotal: goods
              });
              userData.packTotal = packs.length > 0 ? packs.length - 1 : 0; //不包括自己
              userData.goodTotal = goods.length;
              res.status(200).send({
                code: 200,
                data: userData
              });
            }
          );
        }
      });
    } else {
      res.status(200).send({
        code: 100,
        msg: err
      });
    }
  });
};

/**
 *
 * 修改用户默认包
 */
exports.modifyDefaultPack = function(req, res) {
  modifyDefaultPack(req.user.user_id, req.body.id, function(err, data) {
    if (data) {
      res.status(200).send({
        code: 200,
        data: {
          default_pack: data.default_pack,
          default_pack_name: data.default_pack_name
        }
      });
    } else {
      res.status(200).send({
        code: 100,
        msg: err
      });
    }
  });
};

/**
 * 更新用户默认包
 * @param {*} user_id
 * @param {*} id
 * @param {*} callback
 */
function modifyDefaultPack(user_id, id, callback) {
  PM.getPackInfoById(
    {
      user_id: user_id,
      id: id
    },
    function(err, data) {
      if (data) {
        AM.updateAccount(
          {
            user_id: user_id,
            default_pack: data.id,
            default_pack_name: data.name
          },
          function(err, data) {
            callback(err, data);
          }
        );
      } else {
        callback(err);
      }
    }
  );
}
