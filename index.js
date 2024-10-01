const express = require('express');
const app = express();

const fs = require('fs'); 
const path = require('path');
const morgan = require('morgan');


let topMovies = [];
let topMoviesJson = {};
fs.readFile('./top-movies.json', (err, data) => {
    if(err){
        throw err;
    }
    console.log('Read input file:');
    console.log(JSON.parse(data));

    topMoviesJson = data;
    topMovies = JSON.parse(data);
});

// Logging stream to log.txt with append flag set
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// Middleware added below:
app.use(morgan('common', {stream: accessLogStream}));
app.use(express.static('public')); // to use public folder for serving static html files

// Requests & handling
app.get('/', (req, res) => {
    res.send('This will be the homepage for my API!');
});

app.get('/movies', (req, res) => {
    console.log('Top movies json response : '+JSON.stringify(topMoviesJson));
    console.log('Top movies parsed json response :');
    console.log(topMovies);
    //res.send(JSON.stringify(topMovies));
    res.json(topMoviesJson);
});

app.get('/documentation', (req, res) => {
    console.log('The sending file for /documentation request path: '+ __dirname+'/public/documentation.html');
    res.sendFile('/public/documentation.html', {root: __dirname});
});

// Error handler middleware:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('The application encountered an error, please try again.');
});

app.listen(8080, () => {
    console.log('Movie API server is up and listening on port 8080...');
});