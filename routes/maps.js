var express = require('express');
var router = express.Router();

/**
 * get map by map(:name)
 */
router.get('/:name', (req, res) => {
  const list = req.app.get('list');
  const response = req.app.get('response');
  let brainMap = list.find(item => item.name === req.params.name);
  res.json(response(true, '', brainMap));
})

/**
 * get tags set as array
 */
router.get('/:name/tags', (req, res) => {
  const list = req.app.get('list');
  const response = req.app.get('response');
  let brainMap = list.find(item => item.name === req.params.name);
  res.json(response(true, '', Array.from(brainMap.tags)));
})

/**
 * get item in array which contains tag one or more in tags
 * @param {brainMap} array item.tags
 * @param {string} tags 
 */
function filterTag(array, tags) {
  if (tags === undefined || tags === '') {
    return array;
  }
  let result = new Array();
  let tagArr = tags.split(':');
  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    if (item.tags === '') {
      continue;
    } else {
      for (let j = 0; j < tagArr.length; j++) {
        if (item.tags.indexOf(tagArr[j]) !== -1) {
          result.push(item);
        }
      }
    }
  }
  return result;
}

/**
 * search key-value which contains :tag
 */
router.get('/:name/tag/:tag', (req, res) => {
  const list = req.app.get('list');
  const response = req.app.get('response');
  const tag = req.params.tag;
  if (tag === undefined || tag === '') {
    res.json(response(true, 'no result', []));
  }
  let brainMap = list.find(item => item.name === req.params.name);
  let result = [];
  for (let i = 0; i < brainMap.mapList.length; i++) {
    let item = brainMap.mapList[i];
    if (item.tags && item.tags !=='' && item.tags.indexOf(tag) !== -1) {
      result.push({
        'key': item.key,
        'value': item
      });
    }
  }
  res.json(response(true, '', result));
})

/**
 * add tags to set
 * @param {string} set 
 * @param {string} tags 
 */
function addTag(set, tags) {
  let tagStr = tags.split(':');
  for (let k = 0; k < tagStr.length; k++) {
    if (tagStr[k] && tagStr[k] !== '') {
      set.add(tagStr[k]);
    }
  }
}

/**
 * add key-value in map(:name)
 */
router.post('/:name', (req, res) => {
  const list = req.app.get('list');
  const response = req.app.get('response');
  let brainMap = list.find(item => item.name === req.params.name);
  const key = req.body.key;
  const content = req.body.value;
  const time = new Date();
  const tags = req.body.tags;
  const valueObj = {
    'key': key,
    'content': content,
    'time': time,
    'tags': tags
  }
  let success = false;
  let msg = '';
  if (key && content) {
    if (brainMap.map.get(key)) {
      brainMap.mapList.map(item => {
        if (item.key === key) {
          item.content = content;
          item.time = time;
          item.tags = tags;
        }
      })
    } else {
      brainMap.mapList.push(valueObj);
    }
    brainMap.map.set(key, valueObj);
    addTag(brainMap.tags, tags);
    success = true;
  } else {
    msg = 'key or value is null!';
  }
  res.json(response(success, msg, {
    'key': key,
    'value': valueObj
  }));
})

/**
 * get value by key in map(:name)
 */
router.get('/:name/:key', (req, res) => {
  const list = req.app.get('list');
  const response = req.app.get('response');
  let brainMap = list.find(item => item.name === req.params.name);
  res.json(response(true, '', brainMap.map.get(req.params.key)));
})

/**
 * search key-value in map(:name)
 * :type: prefix:前缀, contain:包含
 */
router.get('/:name/:type/:key', (req, res) => {
  const list = req.app.get('list');
  const response = req.app.get('response');
  const searchKey = req.params.key;
  const tags = req.query.tags;
  let brainMap = list.find(item => item.name === req.params.name);
  let result = [];
  if (req.params.type === 'prefix') {
    for (let [key, value] of brainMap.map) {
      if (key.substr(0, searchKey.length) == searchKey) {
        result.push(value);
      }
    }
  } else {
    for (let [key, value] of brainMap.map) {
      if (key.indexOf(searchKey) !== -1) {
        result.push(value);
      }
    }
  }
  // filter by tag
  result = filterTag(result, tags);
  res.json(response(true, '', result.map((v) => {
    return {
      'key': v.key,
      'value': v
    }
  })));
})

router.get('/', function(req, res, next) {
  const list = req.app.get('list');
  const response = req.app.get('response');
  let mapNames = list.map((value) => {
    return value.name;
  });
  res.json(response(true, '', mapNames));
});

module.exports = router;
