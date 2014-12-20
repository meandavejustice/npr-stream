var levelup = require('level');
var db = levelup('./db', {valueEncoding: 'json'});

module.exports = {
  getShows: getShows,
  getStationList: getStationList,
  getKeyStream: getKeyStream
};

function getShows(station, cb) {
  db.get(station, function(err, shows) {
    if (err) {
      cb(err);
    }

    cb(null, shows);
  })
}

function getStationList(cb) {
  db.get('stations', function(err, stations) {
    if (err) {
      cb(err);
      cb = null;
    }
    cb(null, stations);
  });
}

function getKeyStream(cb) {
  var keys = [];
  db.createKeyStream()
  .on('data', function(data) {
    if (data !== 'stations') keys.push(data)
  })
  .on('error', function(err) {
    cb(err)
    cb = null;
  })
  .on('end', function() {
    cb(null, keys)
  })
}
