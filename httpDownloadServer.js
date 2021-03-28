const http = require('http');
const fs = require('fs'), path = require('path');
const zlib = require('zlib');
const readline = require('readline');
const port = process.env.PORT || Number.isFinite(process.argv[2]) ? process.argv[2] : 2121;
const baseDir = process.env.FILE_DIR || Number.isFinite(process.argv[2]) ? process.argv[3] : process.argv[2] || process.cwd();

let reqs = dy = 0;
const server = http.createServer((req, res) => {
  let file = baseDir + req.url;

  fs.stat(file, (e, stats) => {
    if (e) { res.end(e.message); return; }

    if (stats.isFile()) {
      const reqid = reqs++;      
      console.log(`${reqid} - ${path.basename(file)} is downloading...`);
      dy++;
      res.writeHead(200, {
        'Accept-Encoding': 'gzip',
        "Content-Disposition": `attachment; filename="${path.basename(file)}"`,
        "Content-Type": "application/octet-stream",
        'Content-Length': stats.size
      })
      // res.setHeader('Content-Type', 'application/octet-stream');
      const readable = fs.createReadStream(file);
      let currentSize = 0, totalSize = stats.size;
      readable.on('data', (chunk) => {
        // console.clear()
        currentSize += chunk.length;
        readline.moveCursor(process.stdout, 0, reqid - dy);
        readline.clearLine(process.stdout, 0);
        var text = `${reqid} - ${path.basename(file)} sent ${currentSize}/${totalSize} ${Math.round(100 * currentSize / totalSize)}%`;
        process.stdout.write(text);
        readline.moveCursor(process.stdout, -text.length, dy - reqid);
      });

      // readable.pipe(gzipTransform).pipe(encryptTransform).pipe(fileWriteable);
      // readable.pipe(zlib.createGzip()).pipe(res)
      readable.pipe(res);

    } else if (stats.isDirectory()) {
      fs.readdir(file, (e, f) => {
        res.setHeader('Content-Type', 'text/html');
        res.write('<a href="' + path.resolve(req.url + '/..') + '">..</a><br>');
        if (e) { res.end(e.stack); return; }

        f.forEach(element => {
          //console.log(req.url, element)
          res.write('<a href="' + path.join(req.url, element) + '">' + element + '</a><br>');
        });
        res.end('');
      });
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(baseDir);
  console.log('Server running at', server.address());
});
