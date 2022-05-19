var express = require('express');
var router = express.Router();
const fs = require("fs");

// Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function replaceAll(str, match, replacement) {
  return str.replace(new RegExp(escapeRegExp(match), 'g'), () => replacement);
}

/**
 * <filename, List<String>>
 */
var fileContextMap = new Map();
/**
 * GET upload file which encode by base64 and sliced
 */
router.get('/f/:filename/s/:totalNum/seq/:curSeqNo/b/:context', function (req, res, next) {
  const response = req.app.get('response');
  const filename = req.params.filename;
  const totalNum = req.params.totalNum;
  const curSeqNo = req.params.curSeqNo;
  const context = req.params.context;
  let list = fileContextMap.get(filename);
  if (!list) {
    list = new Array();
    for (let i = 0; i < totalNum; i++) {
      list.push('');
    }
    fileContextMap.set(filename, list);
  }
  if (list[curSeqNo] !== undefined && list[curSeqNo] !== '') {
    console.log('over write ' + filename + '[' + curSeqNo + ']=' + context);
  }
  console.log('typeof(context)=', typeof (context));
  console.log('context=', context);
  list[curSeqNo] = replaceAll(replaceAll(context, '-rn-', '\r\n'), '--', '/');
  console.log(filename + '[' + curSeqNo + ']=' + list[curSeqNo]);

  res.json(response(true, 'add success!', { 'curSeqNo': curSeqNo }));
});

/**
 * generate file by received context
 */
router.get('/f/:filename', function (req, res, next) {
  const response = req.app.get('response');
  const filename = req.params.filename;
  const list = fileContextMap.get(filename);
  if (list) {
    // check context
    let misContextIndexArray = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] === undefined || list[i] === '') {
        misContextIndexArray.push(i);
      }
    }
    if (misContextIndexArray.length > 0) {
      res.json(response(false, 'file:' + filename + ' missed context, total sliced=' + list.length, misContextIndexArray));
    }
    // generate file
    let base64Str = '';
    for (let i = 0; i < list.length; i++) {
      base64Str += list[i];
    }
    let bytes = Buffer.from(base64Str, 'base64');
    let filePath = __dirname + "/" + filename;
    fs.writeFileSync(filePath, bytes, 'binary');

    res.json(response(true, 'write file success!', filePath));
  } else {
    res.json(response(false, 'file:' + filename + ' not found!', ''));
  }
});

/**
 * 
 */
router.get('/download', function (req, res, next) {
  const path = req.query.path;
  let filepath = __dirname + "/" + path;
  console.log('download file: ' + filepath);
  const file = fs.readFileSync(filepath, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});


module.exports = router;