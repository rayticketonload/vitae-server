var path = require("path");
var randomstring = require("randomstring");
var fs = require("fs");
var multer = require("multer");
var config = require("../../../app/config");
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    var path = `${config.ROOT_PATH}/public/user/photo`;
    cb(null, path);
  },
  filename: function(req, file, cb) {
    var id = randomstring.generate(32) + path.extname(file.originalname);
    cb(null, id);
  }
});

var upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }
}).single("photo");

var AM = require("../modules/account-manager");
var PM = require("../modules/pack-manager");
var GM = require("../modules/good-manager");

exports.uploadConfig = upload;

exports.uploadPhoto = function(req, res) {
  var file = req.file;
  if (file) {
    console.log("文件类型：%s", file.mimetype);
    console.log("原始文件名：%s", file.originalname);
    console.log("文件大小：%s", file.size);
    console.log("文件保存路径：%s", file.path);

    res.status(200).send({
      code: 200,
      result: "ok",
      path: `/user/photo/${file.filename}`
    });
  } else {
    res.status(200).send({
      code: 100,
      msg: "上传失败"
    });
  }
};

exports.downloadPhoto = function(req, res) {
  if (!req.params.path) {
    res.status(200).send({
      code: 100,
      msg: "path 不能为空"
    });
    return;
  }
  var path = `${config.ROOT_PATH}/user/photo/${req.params.path}`;
  res.download(files);
};
