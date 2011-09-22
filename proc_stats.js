var sys = require('sys');
var spawn = require('child_process').spawn;
var dateutils = require('node-date-utils');

function parseWMIDate(date) {
  if (!date) return null;
  var components = date.split('.');
  var microseconds = 0.0;
  var utcoffset = 0;
  if (components[1]) {
    var c2 = components[1].split('+');
    microseconds = parseFloat(c2[0]);
    utcoffset = parseInt(c2[1]);
  }

  var utcOffsetMilliseconds = utcoffset * 60 * 1000;

  var milliseconds = microseconds / 1000;
  var parsed = new Date(Date.parse(components[0], 'yyyyMMddHHmmss') + milliseconds - utcOffsetMilliseconds);
  return parsed;
}

function getProcessStats(callback) {
  var wmic = spawn('wmic', ['PROCESS', 'get', 'ProcessID,', 'Caption,', 'WorkingSetSize,', 'UserModeTime,', 'KernelModeTime,', 'CreationDate,', 'CommandLine', '/format:csv']);

  var content = '';

  wmic.stdout.on('data', function (data) {
    content = content + data.toString();
  });

  wmic.on('exit', function (code) {
    if (code != 0) {
      callback(code);
      return;
    }

    var linesRaw = content.split('\n');
    var lines = []

    for (var i in linesRaw) {

      if (i == 1) {
        continue
      }

      var rl = linesRaw[i].replace('\r\r', '');

      if (!rl || rl.length == 0) continue;

      var components = rl.split(',');

      var obj = {
        "caption": components[1],
        "commandLine": components[2],
        "creationDate": parseWMIDate(components[3]),
        "processId": parseInt(components[5]),
        "userModeTime": parseInt(components[6]),
        "kernelModeTime": parseInt(components[4]),
        "workingSetSize": parseInt(components[7]),
      };

      if (obj.node == '') continue;

      obj.cpuTimeSeconds = (parseFloat(obj.userModeTime) + parseFloat(obj.kernelModeTime)) / 10000000.0;

      if (obj.creationDate) {
        var diff = new Date().valueOf() - obj.creationDate.valueOf();
        obj.runningTimeSeconds = diff / 1000.0;
        obj.totalCpuPercent = obj.cpuTimeSeconds / obj.runningTimeSeconds * 100;
      }

      lines.push(obj);
    }

    callback(null, lines);
  });
};

module.exports = getProcessStats;