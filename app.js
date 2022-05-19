var createError = require('http-errors');
var express = require('express');
var path = require('path');
const fs = require("fs");
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mapsRouter = require('./routes/maps');
var systemRouter = require('./routes/system');
var fileUtilRouter = require('./routes/fileUtil');

var app = express();
// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
// app.use(bodyParser.json())
// 全局 中间件  解决所有路由的 跨域问题
// app.all('*',function (req,res,next) {
//     res.header('Access-Control-Allow-Origin','*')
//     res.header('Access-Control-Allow-Headers','X-Requested-With,Content-Type')
//     res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
//     next()
// })


// http
const response = (success, message, data) => {
  return {
    success: success,
    message: message,
    data: data
  }
}

// file
const dataFileName = "data.json";
const dataFilePath = __dirname + "/" + dataFileName;
const brainMapTemplate = {
  name: "MyBrain",
  description: "A map of my brain",
  mapList: [
    {
      'key': 'url',
      'content': 'http://localhost:3000',
      'time': new Date(),
      'tags': ''
    }
  ]
};
// 判断文件是否存在，不存在则创建
var list;
fs.access(dataFilePath, fs.constants.F_OK, err => {
  if (err) {
    console.log(dataFilePath + ' not exist, create it.');
    list = new Array();
    // brainMapTemplate.map = Object.fromEntries(brainMapTemplate.map);
    list.push(brainMapTemplate);
    fs.writeFileSync(dataFilePath, JSON.stringify(list, null, 2));
  }
  console.log('read ' + dataFilePath);
  let listStr = fs.readFileSync(dataFilePath, 'utf8');
  list = JSON.parse(listStr);
  console.log(list);
  // 遍历list，将mapList中的对象转换为map放到list的每个元素中
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    // 根据读取到的mapList，将其转换为map
    item.map = new Map();
    for (let j = 0; j < item.mapList.length; j++) {
      const mapItem = item.mapList[j];
      item.map.set(mapItem.key, mapItem);
    }
    // if (item.map) {
    //   item.map = new Map(Object.entries(item.map));
    // } else {
    //   item.map = new Map();
    // }
  }
  console.log('loaded ' + Number(list.length) + ' brain maps');
  app.set('list', list);
});

// set global variable
app.set('response', response);
app.set('dataFilePath', dataFilePath);

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/maps', mapsRouter);
app.use('/system', systemRouter);
app.use('/io', fileUtilRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
