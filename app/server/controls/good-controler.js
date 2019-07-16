var GM = require("../modules/good-manager");

exports.addGood = function (req, res) {
  GM.addGood({
      pic_address: req.body.pic || "", //图片
      user_id: req.user.user_id,
      expire_date: req.body.expireDate || null, //过期时间
      remind_date: req.body.remindDate || null, //提醒时间
      name: req.body.name,
      parent_id: (req.body.parentId && req.body.parentId.trim().toString()) || null,
      quantity: req.body.quantity || 1, //数量
      current_location_name: req.body.currentLocationName || null,
      current_location_id: req.body.currentLocationID || null,
    },
    function (e, data) {
      if (e) {
        res.status(200).send({
          code: 100,
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
 * 获取物品信息
 * @param {*} req
 * @param {*} res
 */
exports.getGoodInfoById = function (req, res) {
  if (!req.body.id.toString().trim()) {
    res.status(200).send({
      code: 100,
      msg: "id 不能为空"
    });
    return;
  }
  GM.getGoodInfoById({
      user_id: req.user.user_id,
      id: (req.body.id && req.body.id.toString().trim()) || null
    },
    function (err, data) {
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
 * 获取物品信息
 * @param {*} req
 * @param {*} res
 */
exports.getGoodListById = function (req, res) {
  if (!req.body.id.toString().trim()) {
    res.status(200).send({
      code: 100,
      msg: "id 不能为空"
    });
    return;
  }

  GM.getListById({
      user_id: req.user.user_id,
      parent_id: (req.body.id && req.body.id.toString().trim()) || null
    },
    function (err, data) {
      if (!err) {
        res.status(200).send({
          code: 200,
          data: data
        });
      } else {
        res.status(400).send("err");
      }
    }
  );

};

/**
 * 更新物品信息
 */
exports.updataGoodInfoById = function (req, res) {
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

  GM.updateGoodInfo({
      id: req.body.id || "",
      pic_address: req.body.pic || [], //图片
      user_id: req.user.user_id,
      expire_date: req.body.expireDate || null, //过期时间
      remind_date: req.body.remindDate || null, //提醒时间
      name: req.body.name,
      quantity: req.body.quantity || 1, // 数量
      parent_id: (req.body.parentId && req.body.parentId.trim().toString()) || null,
      current_location_name: req.body.currentLocationName || null,
      current_location_id: req.body.currentLocationID || null,
    },
    function (err, data) {
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
 * 删除单个物品
 */
exports.delSingleItemById = function(req, res) {
  GM.delSingleItemById(
    {
      id: req.body.id,
      user_id: req.user.user_id,
    },
    function (err, data) {
      if (!err) {
        res.status(200).send({
          code: 200,
          success: true,
          data: data,
        });
      } else {
        res.status(200).send({
          code: 200,
          success: false,
          errMsg: err,
        });
      }
    }
  )
};