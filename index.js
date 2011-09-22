var http = require('http');
var pstats = require('./proc_stats');


http.createServer(function (req, res) {
  pstats(function (err, result) {

    function onlyNode(result) {
      var output = []
      result.forEach(function (r) {
        if (r.commandLine.indexOf("node.exe") != -1) {
          var args = r.commandLine.split(' ');
          r.anodeService = args[2];
          r.anodePort = args[3];
          output.push(r);
        }
      });

      return output;
    }

    result = onlyNode(result).sort(function (a, b) {
      return -1 * (a.totalCpuPercent - b.totalCpuPercent);
    });

    if (req.url.indexOf('alt=json') != -1) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(result));
    } else {
      res.setHeader('content-type', 'text/html');
      var html = '';

      html += '<p>role instance:' + process.env.RoleInstanceID + '</p>';

      html += '<table border=1>';

      html += '<tr>';
      html += '<th>service</th>';
      html += '<th>port</th>';
      html += '<th>processId</th>';
      html += '<th>workingSetSize</th>';
      html += '<th>totalCpuPercent</th>';
      html += '<th>runningTimeSeconds</th>';
      html += '<th>logs</th>';
      html += '</tr>';

      result.forEach(function (r) {
        html += '<tr>';
        html += '<td>' + r.anodeService + '</td>';
        html += '<td>' + r.anodePort + '</td>';
        html += '<td>' + r.processId + '</td>';
        html += '<td>' + r.workingSetSize + '</td>';
        html += '<td>' + Math.round(r.totalCpuPercent * 100) / 100 + ' %</td>';
        html += '<td>' + r.runningTimeSeconds + '</td>';
        html += '<td><a href="http://log.anodejs.org/' + r.anodeService + '">logs</a></td>';
        html += '</tr>';
      });
      html += '</table>';

      html += '<pre>' + JSON.stringify(process.env, null, 2) + '</pre>';

      res.end(html);
    }
  });

}).listen(process.env.ANODEJS_PORT || 50000);

