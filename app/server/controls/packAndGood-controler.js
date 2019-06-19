var PM = require("../modules/pack-manager");
var GM = require("../modules/good-manager");
/**
 * 获取盒子內所有盒子和物品列表
 * @param {*} req
 * @param {*} res
 */
exports.getPackAndGoodListById = function (req, res) {
  var id = (req.body.id && req.body.id.toString().trim()) || null;

  PM.getPackInfoById({
      user_id: req.user.user_id,
      id: id
    },
    function (err, info) {
      if (!err) {
        PM.getListById({
            user_id: req.user.user_id,
            parent_id: id
          },
          function (err, packData) {
            if (!err) {
              GM.getListById({
                  user_id: req.user.user_id,
                  parent_id: id
                },
                function (err, goodData) {
                  if (!err) {
                    setPAGTotalInfoInPacks(req.user.user_id, packData).then(packData => {
                      res.status(200).send({
                        code: 200,
                        data: {
                          currentPack: info,
                          packList: packData,
                          goodList: goodData
                        }
                      });
                    });
                  } else {
                    res.status(400).send("err", err);
                  }
                }
              );
            } else {
              res.status(400).send("err", err);
            }
          }
        );
      }
    }
  );
};

/**
 * 搜索  根据类型及关键字 获取盒子列表及物品列表
 * @param {*} req
 * @param {*} res
 */
exports.search = (req, res) => {
  var pmSearch = PM.search({
    key: req.body.key,
    user_id: req.user.user_id
  });
  var gmSearch = GM.search({
    key: req.body.key,
    user_id: req.user.user_id
  });
  Promise.all([pmSearch, gmSearch])
    .then(results => {
      //
      let packList = results[0].concat();
      let goodList = results[1].concat();
      PM.getUserAllPackList(req.user.user_id, function (err, data) {
        if (!err) {
          let allPasks = data.concat(); //查当前用户全部盒子
          for (let index = 0; index < packList.length; index++) {
            let pack = packList[index];
            allPasks.some((item) => {
              if (pack.parent_id === item.id) {
                pack.parent_name = item.name;
                return;
              }
            });
          }

          for (let index2 = 0; index2 < goodList.length; index2++) {
            let good = goodList[index2];
            allPasks.some((item) => {
              if (good.parent_id === item.id) {
                good.parent_name = item.name;
                return;
              }
            });
          }

          res.status(200).send({
            code: 200,
            data: {
              packList: packList,
              goodList: goodList
            }
          });

        } else {
          res.status(400).send("err", err);
        }
      });

    })
    .catch(err => {
      res.status(400).send("err", err);
    });
};

/**
 * 把当前盒子（数组）附加上当前盒子数量 和 物品数量
 * @param {Array} data
 *  "packTotal": 4,
 *  "goodTotal": 3
 */
setPAGTotalInfoInPacks = function (userId, data) {
  var promises = [];
  data.map(pack => {
    var _packTotal = 0,
      _goodTotal = 0;
    promises.push(
      new Promise((resolve, reject) => {
        PM.getListById({
          user_id: userId,
          parent_id: pack.id
        }, (err, data) => {
          if (!err) {
            _packTotal = data.length;
            GM.getListById({
              user_id: userId,
              parent_id: pack.id
            }, (err, data) => {
              if (!err) {
                _goodTotal = data.length;
                pack.packTotal = _packTotal;
                pack.goodTotal = _goodTotal;
                resolve(pack);
              }
            });
          }
        });
      })
    );
  });
  return Promise.all(promises);
};


/**
 * 旧
 * 获取最近编辑过的数据（盒和物品）（默认6个）
 */
exports.getNewest = (req, res) => {
  var pmSearch = PM.search({
    key: "",
    user_id: req.user.user_id
  });
  var gmSearch = GM.search({
    key: "",
    user_id: req.user.user_id
  });
  Promise.all([pmSearch, gmSearch])
    .then(results => {
      //
      let packList = results[0].concat();
      let goodList = results[1].concat();
      let list = packList.concat(goodList);
      list.sort((a, b) => (
         b.update_timestamp -a.update_timestamp 
      ))

      res.status(200).send({
        code: 200,
        data: {
          list: list.slice(0,6),
        }
      });

    })
    .catch(err => {
      res.status(400).send("err", err);
    });
};

/**
 * 新
 * 获取最近编辑过的数据（盒和物品）（默认6个）
 */
exports.getNewestModify = (req, res) => {
  let pmData = [];
  let gmData = [];
  let result = [];
  PM.getUserAllPackListById(
    {
      user_id: req.user.user_id,
      id: req.body.id,
    },
    function(err, data) {
      if (!err) {
        let preData = data.concat();
        preData.map(v => {
          if (v.parent_id) {
            pmData.push(v);
          }
        });
        GM.getUserAllPackListByPackList(
          {
            user_id: req.user.user_id,
            packList: preData,
          },
          function(err, data) {
            if (!err) {
              gmData = data.concat();
              result = pmData.concat(gmData);
              result.sort((a, b) => b.update_timestamp - a.update_timestamp);
              res.status(200).send({
                code: 200,
                data: result.slice(0, 6),
              });
            } else {
              res.status(200).send({
                code: 200,
                errMsg: err,
              });
            }
          }
        );
      } else {
        res.status(200).send({
          code: 200,
          errMsg: err,
        });
      }
    }
  );
};