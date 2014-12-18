var fs = require('fs');
var saxStream = require("sax").createStream(true);
var podcasts = [];

module.exports = getStations;

function getStations(filePath, cb) {
  saxStream.on("error", function (e) {
    // unhandled errors will throw, since this is a proper node
    // event emitter.
    console.error("error!", e)
    cb(e);
    cb = null;
    // clear the error
    this._parser.error = null
    this._parser.resume()
  })

  saxStream.on('opentag', function(node) {
    var obj = node.attributes;
    podcasts.push(obj);
  })

  var dirStream = fs.createReadStream(filePath)
                  .pipe(saxStream)

  dirStream.on('end', function() {
    fs.writeFile('../podcast_clean.json', JSON.stringify(podcasts, null, 4), function() {
      console.log('done');
    })
    cb(null, podcasts);
  });
}