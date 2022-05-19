var express = require('express');
var router = express.Router();
const fs = require("fs");
const logger = require('morgan');

const save = (filePath, list) => {
  const cloneList = [];
  for (let i = 0; i < list.length; i++) {
    const item = JSON.parse(JSON.stringify(list[i]));
    // if (item.map) {
    //   item.map = Object.fromEntries(item.map);
    // } else {
    //   item.map = {};
    // }
    delete item.map;
    cloneList.push(item);
  }
  fs.writeFileSync(filePath, JSON.stringify(cloneList, null, 2), 'utf8', {'flag': 'w'});
  console.log('write ' + filePath);
}

/* GET users listing. */
router.get('/save', function(req, res, next) {
  const list = req.app.get('list');
  const dataFilePath = req.app.get('dataFilePath');
  const response = req.app.get('response');
  console.log(list);
  save(dataFilePath, list);
  res.json(response(true, 'save success!', list.length));
});

module.exports = router;
