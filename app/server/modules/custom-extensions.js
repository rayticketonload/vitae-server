var util = require('util');
var fs = require('fs');
const { Console } = require('console');
//使用
// 创建标准输出对象到文件
var output = fs.createWriteStream('./stdout.log');
// 创建标准错误输出对象到文件
var errorOutput = fs.createWriteStream('./stderr.log');
// 创建自己的Console对象
var logger = new Console(output, errorOutput);
var count = 5;
// 直接输出到文件stdout.log中
logger.log('count: %d', count);