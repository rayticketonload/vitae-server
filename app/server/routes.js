require("./modules/custom-extensions");
var CT = require("./modules/country-list");

var AC = require("./controls/account-controler");
var PC = require("./controls/pack-controler");
var GC = require("./controls/good-controler");
var PAGC = require("./controls/packAndGood-controler");
var FILE = require("./controls/file-controler");

var COMFIG = require("../config");
var https = require("https");
var jwt = require("jsonwebtoken");
var expressJWT = require("express-jwt");

module.exports = function(app) {
  app.use(
    expressJWT({ secret: COMFIG.SECRET_KEY }).unless({
      path: ["/api/getToken", /^\/api\/download\/photo\/.*/, /^\/user\/photo\/.*/] //除了这个地址，其他的URL都需要验证
    })
  );

  app.use(function(err, req, res, next) {
    if (err.name === "UnauthorizedError") {
      //  这个需要根据自己的业务逻辑来处理（ 具体的err值 请看下面）
      res.status(401).send("老板！Token无效，请先登录");
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(200).send({
        result: "fail",
        error: { code: 100, message: "文件太大" }
      });
    }
  });

  /**
   * 请求 小程序 接口 用户 session_key
   */
  app.post("/api/getToken", AC.getToken);

  /**
   * 获取首页用户信息
   */
  app.get("/api/getUserInfo", AC.getUserInfo);

  /**
   * 修改默认的包
   */
  app.post("/api/modifyDefaultPack", AC.modifyDefaultPack);

  /**
   * 新增盒子
   */
  app.post("/api/addPack", PC.addPack);

  /**
   * 更新盒子信息
   */
  app.post("/api/updataPackInfoById", PC.updatePackInfoById);

  /**
   * 删除盒子
   */
  app.post("/api/deletePackById", PC.deletePackById);

  /**
   * 获取盒子信息
   */
  app.post("/api/getPackInfoById", PC.wxGetPackInfoById);

  /**
   * 获取盒子內所有盒子列表
   */
  app.post("/api/getPackListById", PC.wxGetPackListById);

  /**
   * 获取当前用户默认顶级盒子下的盒子列表
   */
  app.get("/api/getPackListByDefaultPack", PC.getPackListByDefaultPack);
  

  /**
   * 获取当前用户默认顶级盒子下的盒子列表
   * 用于”修改盒子“页面的”存放位置“选择菜单的盒子列表
   */
  app.post("/api/packListForPackModifySelectMenu", PC.packListForPackModifySelectMenu);

  /**
   * 获取当前用户可选默认盒子列表
   */
  app.get("/api/getDefaultPackList", PC.getDefaultPackList);

  /**
   * 新增物品
   */
  app.post("/api/addGood", GC.addGood);

  /**
   * 获取物品信息
   */
  app.post("/api/getGoodInfoById", GC.getGoodInfoById);

  /**
   * 更新物品信息
   */
  app.post("/api/updataGoodInfoById", GC.updataGoodInfoById);

  /**
   * 获取盒子內所有物品列表
   */
  app.post("/api/getGoodListById", GC.getGoodListById);

  /**
   * 获取盒子內所有盒子和物品列表
   */
  app.post("/api/getPAGListById", PAGC.getPackAndGoodListById);

  /**
   * 搜索  根据类型及关键字 获取盒子列表及物品列表
   */
  app.post("/api/search", PAGC.searchByPackId);

  /**
   * 获取最近编辑过的数据（盒和物品）（默认6个）
   */
  app.post("/api/getNewestModify", PAGC.getNewestModify);

  /**
   * 删除单个物品
   */
  app.post("/api/delSingleItemById", GC.delSingleItemById);

  /**
   * 上传
   */
  app.post("/api/upload/photo", FILE.uploadConfig, FILE.uploadPhoto);

  /**
   * 下载
   */
  app.get("/api/download/photo/:path", FILE.downloadPhoto);

  /**
   * 404
   */
  app.get("*", function(req, res) {
    res.status(404).end();
  });
};
