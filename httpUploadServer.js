/* A very simple file upload server, just focus on local network. */
'use strict';

const http = require('http');
const fs = require('fs'), path=require('path');
const port = process.env.PORT || Number.isFinite(process.argv[2]) ? process.argv[2] : 8080;
const uploadDir = process.env.UPLOAD_DIR || Number.isFinite(process.argv[2]) ? process.argv[3] : process.argv[2] || process.cwd();

http.createServer(function (req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    var firstData = true, data, boundary, filename;
    var dataHandler = function (chunk) {
      if (firstData) {
        var binData = chunk.toString('binary');
        var arr = binData.split('\r\n');
        boundary = arr.shift();
        filename = arr.shift().match('filename="(.*)"')[1];
        filename = path.join(uploadDir,filename);
        arr.shift(); // filetype, useless
        arr.shift()//an empty line
        if (arr.indexOf(boundary) != -1) {
          arr.pop();
          arr.pop();
        }
        data = Buffer.from(arr.join('\r\n'), 'binary');
        fs.writeFileSync(filename, '');
        firstData = false;
      } else {
        // write data from last event
        fs.appendFileSync(filename, data);
        data = chunk;
      }
    };

    req.on('data', dataHandler);
    req.once('end', function () {
      // handle the last data
      var binData = data.toString('binary');
      if (binData.indexOf(boundary) == -1) {
        res.end('there is something wrong!');
      } else {
        var arr = binData.split('\r\n');
        arr.pop();
        arr.pop();
        data = Buffer.from(arr.join('\r\n'), 'binary');
        fs.appendFileSync(filename, data);
        res.end('ok-' + filename);
      }
      req.removeListener('data', dataHandler);
    })
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<form action="upload" method="post" enctype="multipart/form-data">');
    res.write('Files: <input type="file" name="uploads" multiple="multiple">');
    res.write('<input type="submit" value="Upload!">');
    res.write('</form>');
    return res.end();
  }
}).listen(port, () => {
  console.log(`http server listening on port ${port}`);
  console.log('upload target dir is', uploadDir);
});
