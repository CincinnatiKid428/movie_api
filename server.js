const http = require('http');
const url = require('url');
const fs = require('fs');

http.createServer((request, response) => {
    let addr = request.url;
    console.log('request.url : '+request.url);
    let filePath = '';
    let q = new URL(addr, 'http://localhost:8080');

    //Timestamp when & what request was received
    fs.appendFile('log.txt', '\nTimestamp: ' + new Date() + 
                    '| URL: ' + addr, (err) => {
        if(err) {
            console.err(err);
        } else {
            console.log('Logged URL request successfully.');
        }
    });

    //Set filePath according to request received:
    if(q.pathname.includes('documentation')) {
        filePath = (__dirname + '/documentation.html');
    } else {
        filePath = 'index.html';
    }

    fs.readFile(filePath, (err, data) => {
        if(err) {
            throw err;
        }

        response.writeHead(200, {'Content-Type':'text/html'});
        response.write(data);
        response.end();
    });
}).listen(8080);

console.log('Server now listening on Port 8080...');