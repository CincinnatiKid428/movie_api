const express = require('express');
const app = express();

const fs = require('fs'); 
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Load top movies object from input file top-movies.json
const topMovies = require('./top-movies.json');

console.log('Loaded top movies from file:');
console.log(topMovies);

// Logging stream to log.txt with append flag set
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// Middleware added below:
app.use(morgan('common', {stream: accessLogStream}));
app.use(express.static('public')); // to use public folder for serving static html files
app.use(bodyParser.json()); // parse request bodies into JSON format

// Requests & handling
app.get('/', (req, res) => {
    res.status(200).send('This will be the homepage for my API!');
});

app.get('/documentation', (req, res) => {
    console.log('The sending file for /documentation request path: '+ path.join(__dirname, 'public', 'documentation.html'));
    //res.sendFile('/public/documentation.html', {root: __dirname});
    res.sendFile(path.join(__dirname, 'public', 'documentation.html'));
});

app.get('/movies', (req, res) => {

    if(!topMovies){
        res.status(400).send('Failed GET : Unable to retrieve movies list.');
    } else {
        console.log('Top movies JSON response:');
        console.log(topMovies);
        res.status(200).json(topMovies);
    }
});

app.get('/movies/:title', (req, res) => {
    let responseMessage = 'Successful GET : This will return information about the movie '+req.params.title;
    console.log(responseMessage);
    res.send(responseMessage);
});

app.get('/genre/:name', (req, res) => {
    let responseMessage = 'Successful GET : This will return information about the movie genre '+req.params.name;
    console.log(responseMessage);
    res.send(responseMessage);
});

app.get('/director/:name', (req, res) => {
    let responseMessage = 'Successful GET : This will return information about director '+req.params.name;
    console.log(responseMessage);
    res.send(responseMessage);
});

app.post('/users', (req, res) => {
    let responseMessage = 'Successful POST : This would try to create a unique user account with username/password from req.body';

    //req.body will contain username and password, bus logic here 

    console.log(responseMessage);
    res.send(responseMessage);
});

app.put('/users', (req, res) => {
    let responseMessage = 'Successful PUT : This would validate user account credentials with new username OR password held in req.body';

    //req.body will contain either new usernam OR new password to be reset

    console.log(responseMessage);
    res.send(responseMessage);
});

app.post('/movies/favorites/:title', (req, res) => {
    let responseMessage = 'Successful POST : Trying to add movie '+req.params.title+' to favorites list for current account';

    console.log(responseMessage);
    res.send(responseMessage);
});

app.delete('/movies/favorites/:title', (req, res) => {
    let responseMessage = 'Successful DELETE : Trying to delete movie '+req.params.title+' from favorites list for current account';

    console.log(responseMessage);
    res.send(responseMessage);
});

app.delete('/users', (req, res) => {
    let responseMessage = 'Successful DELETE : This will deregister a user account with valid credentials in req.body';

    //req.body will contain credentials for the account to be deleted

    console.log(responseMessage);
    res.send(responseMessage);
});


// Error handler middleware:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('The application encountered an error, please try again.');
});


app.listen(8080, () => {
    console.log('Movie API server is up and listening on port 8080...');
});