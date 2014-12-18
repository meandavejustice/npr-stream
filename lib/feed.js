var FeedParser = require('feedparser')
  , request = require('request')
  , util = require('util');

module.exports = getFeed;

function compare(object, prop) {
  var str = object[prop];
  return (!~str.indexOf('<') && !!~str.indexOf('.mp3'));
}

function scanObj(object) {
  for (var prop in object) {
    if (object.hasOwnProperty(prop)) {
      if (typeof object[prop] === 'string') {
        if (compare(object, prop)) {
          return object[prop];
        }
      } else if (typeof object[prop] === 'object') {
        scanObj(object[prop]);
      }
    }
  }
}

function getFeed(url, cb) {
  var req = request(url)
    , feedparser = new FeedParser()
    , urls = [];

  req.on('error', function (error) {
    // handle any request errors
    // console.warn(error);
  });
  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(feedparser);
  });

  feedparser.on('error', function(error) {
    cb(error);
//    cb = null;
  });

  feedparser.on('end', function() {
    cb(null, urls);
  })
  feedparser.on('readable', function() {
    // This is where the action is!
    var stream = this
      , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
      , item;

    while (item = stream.read()) {
      var urlObj = scanObj(item);

      if (urlObj && !!~urlObj.indexOf('http')) {
        var obj = {
          'title': item.title,
          'url': urlObj.replace(' ', '')
        };

        urls.push(obj);
      } else {
        util.inspect(item);
      }
    }
  });

}