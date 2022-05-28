var express = require('express');
var router = express.Router();
const fs = require("fs");
const crypto = require('crypto');

// Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function replaceAll(str, match, replacement) {
  return str.replace(new RegExp(escapeRegExp(match), 'g'), () => replacement);
}

/**
 * get file md5
 * @param {Buffer} buffer 
 */
function getMd5(buffer) {
  const hash = crypto.createHash('md5');
  hash.update(buffer, 'binary');
  return hash.digest('hex');
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
  console.log('seq:' + curSeqNo);
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
  //console.log('typeof(context)=', typeof (context));
  //console.log('context=', context);
  list[curSeqNo] = replaceAll(replaceAll(context, '-rn-', '\r\n'), '--', '/');
  //console.log(filename + '[' + curSeqNo + ']=' + list[curSeqNo]);

  res.json(response(true, '', { 'curSeqNo': curSeqNo }));
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
  
    const md5 = getMd5(bytes);
    console.log('md5=' + md5);

    fs.writeFileSync(filePath, bytes, 'binary');

    res.json(response(true, 'write file success!', {'path' : filePath, 'md5' : md5}));
  } else {
    res.json(response(false, 'file:' + filename + ' not found!', ''));
  }
});

/**
 * get file md5
 * url: /io/md5?path=
 */
router.get('/md5', function (req, res, next) {
  const response = req.app.get('response');
  const path = req.query.path;
  let filepath = __dirname + "/" + path;
  console.log('read file: ' + filepath);
  fs.access(filepath, fs.constants.F_OK, err => {
    if (err) {
      res.json(response(false, 'file:' + filepath + ' not found!', ''));
    } else {
      const file = fs.readFileSync(filepath, 'binary');
      const md5 = getMd5(file);
      console.log('md5=' + md5);
      res.json(response(true, 'success!', {'path' : filepath, 'md5' : md5}));
    }
  });
});

/**
 * download file
 * url: /io/download?path=
 */
router.get('/download', function (req, res, next) {
  const path = req.query.path;
  let filepath = __dirname + "/" + path;
  console.log('download file: ' + filepath);
  const file = fs.readFileSync(filepath, 'binary');
  const md5 = getMd5(file);
  console.log('md5=' + md5);
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});


module.exports = router;