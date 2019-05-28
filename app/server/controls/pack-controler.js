var AM = require("../modules/account-manager");
var PM = require("../modules/pack-manager");
var GM = require("../modules/good-manager");

/**
 * 新增
 * @param {*} req
 * @param {*} res
 */
exports.addPack = function(req, res) {
  PM.wxAddNewPack(
    {
      user_id: req.user.user_id,
      name: req.body.name.trim().toString(),
      parent_id: (req.body.parentId && req.body.parentId.trim().toString()) || null,
      image_path: (req.body.imagePath && req.body.imagePath.trim().toString()) || ""
    },
    function(e, data) {
      if (e) {
        res.status(200).send({
          code: data,
          msg: e
        });
      } else {
        res.status(200).send({
          code: 200,
          data: {
            id: data.id
          }
        });
      }
    }
  );
};

/**
 * 获取盒子內所有盒子列表
 * @param {*} req
 * @param {*} res
 */
exports.wxGetPackListById = function(req, res) {
  getListById(req, res);
};

/**
 * 获取 当前用户 顶级盒子 列表
 * @param {*} req
 * @param {*} res
 */
exports.getDefaultPackList = function(req, res) {
  req.body.id = null;
  getListIncludeTotalInfoById(req, res);
};

/**
 * 获取当前用户默认顶级盒子下的盒子列表
 * @param {*} req
 * @param {*} res
 */
exports.getPackListByDefaultPack = function(req, res) {
  AM.getAccountByUserId(req.user.user_id).then(user => {
    //获取顶点盒子以下的所有盒子数
    PM.getUserAllPackListById({ user_id: req.user.user_id, id: user.default_pack }, function(err, data) {
      if (err)
        res.status(200).send({
          code: 100,
          msg: err
        });
      console.log(data);
      res.status(200).send({
        code: 200,
        data: data
      });
    });
  });
};

/**
 * 根据ID获取盒子 下的 所有盒子列表 （ 包括 所有的物品数量 所有盒子数量 ）
 */
function getListIncludeTotalInfoById(req, res) {
  PM.getListById(
    {
      user_id: req.user.user_id,
      parent_id: (req.body.id && req.body.id.toString().trim()) || null
    },
    function(err, data) {
      if (!err) {
        var pasks = data.concat(); // 查出来的盒子数（ 没包括 所有的物品数量 所有盒子数量 ）
        //
        PM.getUserAllPackList(req.user.user_id, function(err, data) {
          var allPasks = data.concat(); //查当前用户全部盒子
          var packTotal = 0;
          var goodTotal = 0;
          var packs = [];
          var promises = [];

          for (let index = 0; index < pasks.length; index++) {
            var pack = pasks[index]; // 要输出的某个盒子
            var list = [];
            var ids = new Set([pack.id]);
            list.push(pack);
            var length = 0;
            //
            do {
              length = ids.size;
              for (var i in allPasks) {
                if (ids.has(allPasks[i].parent_id)) {
                  ids.add(allPasks[i].id);
                  list.push(allPasks[i]);
                  delete allPasks[i];
                }
              }
            } while (ids.length > length);
            promises.push(
              new Promise((resolve, reject) => {
                var goods = [];
                GM.getUserAllPackListByPackList(
                  {
                    user_id: req.user.user_id,
                    packList: list
                  },
                  function(err, data) {
                    if (err) reject();
                    if (data.length > 0) {
                      goods = data.concat();
                    }
                    resolve(goods);
                  }
                );
              }) //end promise
            );
            pack.packTotal = list.length > 0 ? list.length - 1 : 0; //不包括自己;
            packs.push(pack);
          }
          //
          Promise.all(promises).then(function(results) {
            packs.map(function(item, idx) {
              item.goodTotal = results[idx].length;
            });
            res.status(200).send({
              code: 200,
              data: packs
            });
          }); //end Promise.all
        });
      } else {
        res.status(400).send("err", err);
      }
    }
  );
}

/**
 * 获取盒子内所有盒子列表
 * @param {*} req
 * @param {*} res
 */
function getListById(req, res) {
  PM.getListById(
    {
      user_id: req.user.user_id,
      parent_id: (req.body.id && req.body.id.toString().trim()) || null
    },
    function(err, data) {
      if (!err) {
        res.status(200).send({
          code: 200,
          data: data
        });
      } else {
        res.status(400).send("err", err);
      }
    }
  );
}

/**
 * 获取盒子信息
 * @param {*} req
 * @param {*} res
 */
exports.wxGetPackInfoById = function(req, res) {
  if (!req.body.id.toString().trim()) {
    res.status(200).send({
      code: 100,
      msg: "id 不能为空"
    });
    return;
  }
  PM.getPackInfoById(
    {
      user_id: req.user.user_id,
      id: (req.body.id && req.body.id.toString().trim()) || null
    },
    function(err, data) {
      if (!err) {
        if (!data) {
          res.status(200).send({
            code: 100,
            msg: "没有数据"
          });
          return;
        }
        res.status(200).send({
          code: 200,
          data: data
        });
      } else {
        res.status(200).send({
          code: 100,
          msg: err
        });
      }
    }
  );
};

/**
 * 更新盒子信息
 */
exports.updatePackInfoById = function(req, res) {
  if (!req.body.id.toString().trim()) {
    res.status(200).send({
      code: 100,
      msg: "id 不能为空"
    });
    return;
  }
  if (!req.body.name.toString().trim()) {
    res.status(200).send({
      code: 100,
      msg: "name 不能为空"
    });
    return;
  }
  PM.updatePackInfo(
    {
      user_id: req.user.user_id,
      name: req.body.name.toString().trim(),
      parentId: (req.body.parentId && req.body.parentId.toString().trim()) || null,
      id: (req.body.id && req.body.id.toString().trim()) || null,
      imagePath: (req.body.imagePath && req.body.imagePath.trim().toString()) || ""
    },
    function(err, data) {
      if (err) {
        res.status(200).send({
          code: data,
          msg: err
        });
      } else {
        res.status(200).send({
          code: 200,
          data: data
        });
      }
    }
  );
};

/**
 * 删除
 * @param {*} req
 * @param {*} res
 */
exports.deletePackById = (req, res) => {
  //获取顶点盒子以下的所有盒子数
  var packs = [];
  var goods = [];
  PM.getUserAllPackListById({ user_id: req.user.user_id, id: req.body.id }, function(err, data) {
    if (err)
      res.status(200).send({
        code: 100,
        msg: err
      });
    if (data.length > 0) {
      packs = data.concat();
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
          PM.deletePackByList({ list: packs.map(item => item.id), user_id: req.user.user_id }, function(err, data) {
            if (!err) {
              GM.deleteGoodByList({ list: goods.map(item => item.id), user_id: req.user.user_id }, function(err, data) {
                if (!err) {
                  res.status(200).send({
                    code: 200,
                    data: data,
                    success: true
                  });
                }
              });
            }
          });
        }
      );
    } else {
      res.status(200).send({
        code: 200,
        data: "没有数据"
      });
    }
  });

  /*  PM.deletePackByList({ id: req.body.id, user_id: req.user.user_id }, function(err, data) {
    if (err) {
      res.status(200).send({
        code: 100,
        msg: err
      });
    } else {
      res.status(200).send({
        code: 200,
        data: data
      });
    }
  }); */
};
