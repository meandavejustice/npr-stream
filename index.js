var fs = require('fs');
var blessed = require('blessed');
var Speaker = require('speaker');
var lame = require('lame');
var request = require('request');
var orm = require('./orm');
var currentStream;

var screen = blessed.screen();

function getSpeaker() {
  return new Speaker({
    channels: 2,
    bitDepth: 16,
    sampleRate: 44100
  });
}

fs.readFile('./computer.txt', {"encoding": "utf8"}, function(err, content) {
  var logo = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: process.stdout.columns,
    height: 25,
    tags: true,
    content: content,
    border: {
      type: 'line',
      style: {
        "bg": "pink"
      }
    }
  });

  var list = blessed.list({
    parent: screen,
    top: logo.height,
    left: 0,
    width: '100%',
    height: '70%',
    selectedFg: 'black',
    selectedBg: '#FFA500',
    tags: true,
    border: {
      type: 'line',
      style: {
        "bg": "pink"
      }
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'orange'
      }
    },
    keys: true,
    vi: true
  });

  function genStationList() {
    orm.getKeyStream(function(err, stations) {
      getMenu('NPR Station list', stations, function(ev) {
        if (ev.content.toLowerCase === 'exit') {
          process.exit(0);
        } else if (ev.content.toLowerCase === 'back') {
          getStartMenu('Welcome');
        } else {
          genShowList(ev.content);
        }
      });
      screen.key(['b'], function(ch, key) {
        getStartMenu('Welcome');
      });
    });
  }

  function genShowList(station) {
    orm.getShows(station, function(err, shows) {
      if (err) console.log(err);
      var urls = {};
      var titles = [];

      if (!shows) return;
      shows.forEach(function(show) {
        urls[show.title] = show.url;
        titles.push(show.title);
      });

      getMenu('Shows for ' + station, titles, function(ev) {
        var url = urls[ev.content];

        if (url === undefined) {
          process.exit(1);
        }
        if (currentStream) stop();
        play(url);
      });

      screen.key(['b'], function(ch, key) {
        genStationList();
      });
      screen.key(['x'], function(ch, key) {
        stop();
      });
    })
  }

  function play(url) {
    debugger;
    currentStream = request(url)
    .pipe(new lame.Decoder())
    .pipe(getSpeaker());
  }

  function pause() {
    currentStream.pause();
  }

  function stop() {
    currentStream.end();
    currentStream = null;
  }

  function getStartMenu(header, items) {
    list.setItems(['All Stations', 'Popular', 'Your Stations', 'Sync', 'Submit Your Top Stations', 'Exit']);
    list.on('select', function(ev) {
      var result = ev.content.toLowerCase();
      if (result === 'all stations') {
        genStationList();
      } else if (result === 'exit') {
        process.exit(0);
      }
    });

    // list.off('select');
    screen.append(logo);
    screen.append(list);
    screen.render();
    list.focus();
  }

  function getMenu(header, items, onSelect) {
    list.setItems(items);
    list.off('select');
    list.on('select', onSelect);
    screen.append(logo);
    screen.append(list);
    screen.render();
    list.focus();
  }

  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });

  getStartMenu('Welcome');
});