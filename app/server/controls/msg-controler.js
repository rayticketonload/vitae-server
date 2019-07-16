var AM = require('../modules/account-manager');
var PM = require('../modules/pack-manager');
var PC = require("../controls/pack-controler");
var GM = require('../modules/good-manager');
var MM = require('../modules/msg-manager');
var moment = require('moment');

/**
 * 遍历一次消息
 * @param {*} req
 * @param {*} res
 */
exports.initMsg = function(req, res) {
  // 组合出 today 的日期字符串，拼装成和数据里面的日期字符串格式一样
  const getDate = new Date();
  let y = getDate.getFullYear();
  let m = getDate.getMonth() + 1
  m = m < 10 ? ('0' + m) : m;
  let d = getDate.getDate();
  d = d < 10 ? ('0' + d) : d;
  // 今天的时间戳
  let today = Date.parse(new Date(`${y}-${m}-${d}`));

  // 先获取用户全部物品的 list
  GM.getUserAllGoodList (
    req.user.user_id,
    function (err, data) {
      if (!err) {

        if (data.length == 0) {
          res.status(200).send({
            code: 200,
            errMsg: '当前用户没有创建物品',
            msg_list: [],
          });
          return;
        }

        // 第一次过滤，得出 today 能够发出消息提醒的物品列表
        let filter_1stTime = [];
        data.map(item => { 
          if (
            item.remind_date && 
            Date.parse(new Date(item.remind_date)) == today ||
            item.remind_date &&
            Date.parse(new Date(item.remind_date)) < today
          ) {
            filter_1stTime.push(item);
          }
          // 今天新建的物品，并且设置今天是过期日期的物品是无法进一步设置提醒日期的，所以这类物品的过期日期就是提醒日期
          // if (
          //   item.expire_date && 
          //   Date.parse(new Date(item.expire_date)) == today &&
          //   !item.remind_date
          // ) {
          //   filter_1stTime.push(item);
          // }
        });

        // 组装信息对象
        let preMsgList = [];
        let preMsgObj = {};
        MM.getUserAllMsg(
          req.user.user_id,
          function (err, data) {
            if(!err) {

              // 用户之前一条信息都没有
              if (data.length == 0) {
                filter_1stTime.map(item => {
                  preMsgObj = {
                    user_id: req.user.user_id,
                    cook_book: null,
                    cook_book_url: null,
                    del: false,
                    msg_create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    item_id: item.id, 
                    item_name: item.name,
                    item_create_date: item.date,
                    item_expire_date: item.expire_date,
                    item_remind_date: item.remind_date,
                    item_current_location_name: item.current_location_name,
                    item_current_location_id: item.current_location_id,
                  };
                  preMsgList.push(preMsgObj);
                });

                MM.addMsg(
                  preMsgList,
                  function (err, data) {
                    if (!err) {
                      MM.getUserAllMsg(
                        req.user.user_id,
                        function (err, data) {
                          if (!err) {
                            res.status(200).send({
                              code: 200,
                              msg: '用户第一次发生信息接收',
                              msg_list: data,
                            });
                          } else {
                            res.status(200).send({
                              code: 100,
                              errMsg: err,
                            });
                          }
                        }
                      )
                    } else {
                      res.status(200).send({
                        code: 100,
                        errMsg: err,
                      });
                    }
                  },
                );
              }

              // 用户之前是有信息的
              if (data.length > 0) {
                // 进行第二次过滤，把 today 能够发出消息提醒的物品，但又已经发过信息的，过滤出来
                let needToSplice = [];
                let filter_2ndTime = [];

                filter_1stTime.map(item => {
                  data.map(f => {
                    if (item.id == f.item_id && item.remind_date == f.item_remind_date) {
                      needToSplice.push(item);
                    };
                  });
                });

                needToSplice.map(item => {
                  filter_1stTime.map(k => {
                    if (item.id != k.id) {
                      filter_2ndTime.push(k);
                    } else {
                      filter_2ndTime.splice(k);
                    }
                  });
                });

                // 根据第二次过滤的结果，输出最终可以发消息的物品
                let final = null;
                if (filter_2ndTime.length == 0) {
                  res.status(200).send({
                    code: 200,
                    errMsg: '没有新信息',
                    // flow: {
                    //   filter_1stTime: filter_1stTime,
                    //   needToSplice: needToSplice,
                    //   filter_2ndTime: filter_2ndTime,
                    // },
                    msg_list: data,
                  });
                  return;
                }
                
                if (filter_2ndTime.length > 0) {
                  filter_2ndTime.map(item => {
                    preMsgObj = {
                      user_id: req.user.user_id,
                      cook_book: null,
                      cook_book_url: null,
                      del: false,
                      msg_create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                      item_id: item.id, 
                      item_name: item.name,
                      item_create_date: item.date,
                      item_expire_date: item.expire_date,
                      item_remind_date: item.remind_date,
                      item_current_location_name: item.current_location_name,
                      item_current_location_id: item.current_location_id,
                    };
                    preMsgList.push(preMsgObj);
                  });
                  final = preMsgList;
                }

                // 写入库
                MM.addMsg(
                  final,
                  function (err, data) {
                    if (!err) {
                      MM.getUserAllMsg(
                        req.user.user_id,
                        function (err, data) {
                          if (!err) {
                            res.status(200).send({
                              code: 200,
                              // flow: {
                              //   filter_1stTime: filter_1stTime,
                              //   needToSplice: needToSplice,
                              //   filter_2ndTime: filter_2ndTime,
                              //   preMsgList: preMsgList,
                              //   final: final,
                              // },
                              msg_list: data,
                            });
                          } else {
                            res.status(200).send({
                              code: 100,
                              errMsg: err,
                            });
                          }
                        }
                      )
                    } else {
                      res.status(200).send({
                        code: 100,
                        errMsg: err,
                      });
                    }
                  },
                );
              }
            } else {
              res.status(200).send({
                code: 100,
                errMsg: err, 
              });   
            }
          },
        )
      } else {
        res.status(200).send({
          code: 100,
          errMsg: err,
        });
      }
    }
  )
};

/**
 * 更新信息逻辑删除状态
 */
exports.deleteMsgById = function (req, res) {
  MM.deleteMsgById(
    {
      user_id: req.user.user_id,
      id: req.body.id,
    },
    function (err, data) {
      if (!err) {
        res.status(200).send({
          code: 200,
          data: data,
        });
      } else {
        res.status(200).send({
          code: 100,
          errMsg: err,
        });
      }
    }
  );
};