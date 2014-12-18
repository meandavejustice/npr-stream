var path = require('path');
var levelup = require('level');
var db = levelup('../db', {valueEncoding: 'json'});
var getStations = require('./stations');
var getFeed = require('./feed');
var stationFile = path.normalize('data/podcast_directory.xml');

getStations(stationFile, function(err, stations) {
  if (err) console.log('ERR: putting getting stations')

  stations.forEach(function(station) {
    if (!station.xmlUrl) return;
    var xmlURL = station.xmlUrl;
    if (!!~xmlURL.indexOf('feed://')) {
      xmlURL = xmlURL.replace(/feed:\/\//, 'http://')
    } else if (xmlURL.indexOf('.xml') === -1 &&
               xmlURL.indexOf('rss') === -1 &&
               xmlURL.indexOf('kusc.org') === -1 &&
               xmlURL.indexOf('ideastream.org') === -1 &&
               xmlURL.indexOf('publicbroadcasting.net') === -1) {
      xmlURL = xmlURL + '.xml';
    }

    if (xmlURL.indexOf('http://') === -1) {
      xmlURL = xmlURL.replace(/.xml.xml/, '.xml');
    }

    if (xmlURL.indexOf('http://') === -1) {
      xmlURL = 'http://' + xmlURL;
    }

    getFeed(xmlURL, function(err, value) {
      if (err) {
        console.log('ERROR getting feed: ', err, ' url: ', xmlURL);
      } else {
        if (station.title && value.length) {
          db.put(station.title, value, function(err) {
            if (!err) {
              console.log('PUT: ', station.title, value);
            } else {
              console.log('ERROR: ', err);
            }
          });
        }
      }
    });
  });
});
