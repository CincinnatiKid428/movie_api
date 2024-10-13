const express = require('express');
const app = express();

const fs = require('fs'); 
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Load movies object from input file movies.json -- data found in this file taken from https://www.omdbapi.com/
const movies = require('./movies.json');

console.log('* * * Loaded movies from file:');
console.log(movies);

// Logging stream to log.txt with append flag set
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// Middleware added below:
app.use(morgan('common', {stream: accessLogStream}));
app.use(express.static('public')); // to use public folder for serving static html files
app.use(bodyParser.json()); // parse request bodies into JSON format

// Requests & handling -----------------------------------------------------
app.get('/', (req, res) => {
    res.status(200).send('This will be the homepage for my API!');
});

app.get('/documentation', (req, res) => {
    console.log('The sending file for /documentation request path: '+ path.join(__dirname, 'public', 'documentation.html'));
    res.sendFile(path.join(__dirname, 'public', 'documentation.html'));
});

// Get a list of all movies (titles) ---------------------------------------
app.get('/movies', (req, res) => {

    if(!movies) {
        res.status(400).send('Failed GET : Unable to retrieve movies list.');
    } else {
        let responseMovies = {"movies" : []};
        let movieItem = {};

        //Build the list of favorite movies using only their titles
        movies.movies.forEach((movieItem) => {
            responseMovies.movies.push( {"title" : movieItem.title} );
        });

        res.status(200).json(responseMovies);
    }
});

// Get information about a movie by title ---------------------------------------
app.get('/movies/:title', (req, res) => {
    let findTitle = req.params.title;
    console.log('GET : Searching for info on movie: '+findTitle);

    if(!findTitle){
        res.status(400).send('Failed GET : Title invalid : '+req.params.title);
    } else {
        let responseMovie = {};
        let movieItem = {};
        let foundMovie = false;

        // Search for movie in list and prepare response if found
        for(movieItem of movies.movies) {

            if(foundMovie) {
                break;
            } else if(findTitle === movieItem.title) {
                foundMovie = true;
                responseMovie = {"movie" : {}};
                responseMovie.movie = movieItem;
                console.log('Successful GET : Returning movie info: ');
                console.log(responseMovie);
                res.status(200).json(responseMovie);
            }
        };

        // Can't find the movie in the list => responseMovie is still an empty object
        if( !foundMovie ){
            res.status(400).send('Failed GET : Could not find movie ['+req.params.title+'] in list.');
        }
    }
});

// Get information about a genre by name ---------------------------------------
app.get('/genre/:name', (req, res) => {
    let responseMessage = 'Successful GET : This will return information about the movie genre '+req.params.name;
    console.log(responseMessage);
    res.send(responseMessage);
});

// Get information about a director by name -------------------------------------
app.get('/director/:name', (req, res) => {
    let responseMessage = 'Successful GET : This will return information about director '+req.params.name;
    console.log(responseMessage);
    res.send(responseMessage);
});

// Register a new user account --------------------------------------------------
app.post('/users', (req, res) => {
    let responseMessage = 'Successful POST : This would try to create a unique user account with username/password from req.body';

    //req.body will contain username and password, bus logic here 

    console.log(responseMessage);
    res.send(responseMessage);
});

// Update an account username OR password ---------------------------------------
app.put('/users', (req, res) => {
    let responseMessage = 'Successful PUT : This would validate user account credentials with new username OR password held in req.body';

    //req.body will contain either new usernam OR new password to be reset

    console.log(responseMessage);
    res.send(responseMessage);
});

// Add a movie to user's favorites list ---------------------------------------
app.post('/movies/favorites/:title', (req, res) => {
    let responseMessage = 'Successful POST : Trying to add movie '+req.params.title+' to favorites list for current account';

    console.log(responseMessage);
    res.send(responseMessage);
});

// Remove a movie from user's favorites list -----------------------------------
app.delete('/movies/favorites/:title', (req, res) => {
    let responseMessage = 'Successful DELETE : Trying to delete movie '+req.params.title+' from favorites list for current account';

    console.log(responseMessage);
    res.send(responseMessage);
});

// Deregister a user account --------------------------------------------------
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