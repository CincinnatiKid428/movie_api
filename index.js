const express = require('express');
const app = express();

const { check, validationResult } = require('express-validator');
const validator = require('validator'); //used for date validation
const { checkValidationResults } = require('./util.js');

const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

// Connection to MongoDB if using local database
//mongoose.connect('mongodb://localhost:27017/myFlix', {});

// Connection to MongoDB if using Atlas database
mongoose.connect(process.env.DB_CONNECTION_URI);

// Express middleware:
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // to use public folder for serving static html files

// Logging stream to log.txt with append flag set
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('common', { stream: accessLogStream }));

app.use(bodyParser.json()); // parse request bodies into JSON format

// Use CORS before routing to restrict access to specified domains
const cors = require('cors');
app.use(cors()); // Allow all domains access to API

let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport.js');

// Requests & handling -----------------------------------------------------

app.get('/', (req, res) => {
    res.status(200).send('This will be the homepage for my API!');
});

// Static HTML Page for API Documentation
app.get('/documentation', (req, res) => {
    console.log('Sending file for /documentation request path: ' + path.join(__dirname, 'public', 'documentation.html'));
    res.sendFile(path.join(__dirname, 'public', 'documentation.html'));
});

// Get a list of all movies with information ---------------------------------------
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {

    try {
        console.log("GET: Request for list of all movies...");

        const responseMovies = await Movies.find();
        if (!responseMovies) {
            return res.status(404).send('Failed GET - Could not retrieve movies: ' + responseMovies);
        } else {
            return res.status(200).json(responseMovies);
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Failed GET - Server error retreiving movie list: ' + err);
    }
});

// Get information about a movie by title ---------------------------------------
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }),
    [
        check('Title', 'Invalid movie title - may only contain alphanumeric characters, spaces, hyphens, colons, and ampersands').matches(/^[a-zA-Z0-9\s\-\:\&]+$/)
    ], async (req, res) => {

        //Check validation on movie title
        if (!checkValidationResults(validationResult(req), res)) {
            return; //Response sent back to client by checkValidationResults
        }

        try {
            console.log('GET : Searching for info on movie: ' + req.params.Title);

            const movieFound = await Movies.findOne({ Title: req.params.Title });
            let returnMovie = {
                Title: movieFound?.Title ?? '',
                ReleaseYear: movieFound?.ReleaseYear ?? '',
                Rating: movieFound?.Rating ?? '',
                Description: movieFound?.Description ?? '',
                Director: movieFound?.Director.Name ?? '',
                Genre: movieFound?.Genre.Name ?? '',
                Actors: movieFound?.Actors ?? [],
                ImageURL: movieFound?.ImageURL ?? '',
                Featured: movieFound?.Featured ?? ''
            };

            console.log("GET: The returnMovie value is:");
            console.log(returnMovie);
            return res.status(200).json(returnMovie);

        } catch (err) {
            console.error(err);
            return res.status(500).send("Failed GET - Error looking for movie details about :" + req.params.Title + " with error : " + err);
        }
    });

// Get information about a genre by name ---------------------------------------
app.get('/genre/:Name', passport.authenticate('jwt', { session: false }),
    [
        check('Name', 'Invalid genre name, may only contain alpha characters, spaces and hyphens').matches(/^[a-zA-Z0-9\s\-]+$/)
    ], async (req, res) => {

        //Check validation on director name
        if (!checkValidationResults(validationResult(req), res)) {
            return; //Response sent back to client by checkValidationResults
        }

        try {
            console.log('GET: Looking for information about the movie genre ' + req.params.Name);

            const genreFoundInMovie = await Movies.findOne({ "Genre.Name": req.params.Name });
            return res.status(200).json(genreFoundInMovie.Genre);

        } catch (err) {
            console.error(err);
            return res.status(500).send("Failed GET : Could not get info about genre " + req.params.Name + " with error : " + err);
        }
    });

// Get information about a director by name -------------------------------------
app.get('/director/:Name', passport.authenticate('jwt', { session: false }),
    [
        check('Name', 'Invalid director name, must be alpha characters, hyphen or apostrophe').matches(/^[a-zA-Z\s\-\']+$/)
    ], async (req, res) => {

        //Check validation on director name
        if (!checkValidationResults(validationResult(req), res)) {
            return; //Response sent back to client by checkValidationResults
        }

        try {
            console.log('GET: Looking for information about director ' + req.params.Name);

            const directorFoundInMovie = await Movies.findOne({ "Director.Name": req.params.Name });
            return res.status(200).json(directorFoundInMovie.Director);

        } catch (err) {
            console.error(err);
            return res.status(500).send("Failed GET : Could not get info about director " + req.params.Name + " with error : " + err);
        }
    });

// Register a new user account --------------------------------------------------

/* Request body JSON should use this format:
    {
        Username: String,
        Password: String,  //will be hashed prior to storing
        Email: String,
        Birthdate: Date
    }
}*/
app.post('/users',
    [
        //Validate user inputted fields from request body
        check('Username', 'Username cannot be empty').not().isEmpty(),
        check('Username', 'Username must be at least 5 characters').isLength({ min: 5 }),
        check('Username', 'Username contains non-alphanumeric characters -- not permitted').isAlphanumeric(),
        check('Password', 'Password cannot be empty').not().isEmpty(),
        check('Email', 'Email address is invalid').isEmail()
        //Birthdate validation performed below as it is not a required field
    ],
    async (req, res) => {

        //Check for validation errors before registering new user
        if (!checkValidationResults(validationResult(req), res)) {
            return; //Response sent back to client by checkValidationResults
        }

        //Birthdate validation for proper date format, validator.isDate() defaults to yyyy/mm/dd
        let dateValue = req.body.Birthdate;
        if (!validator.isDate(dateValue)) {
            dateValue = '';
        }

        try {
            console.log('POST: Trying to register a user: ');
            console.log(JSON.stringify(req.body));

            const user = await Users.findOne({ Username: req.body.Username });

            if (user) {
                res.status(400).send(req.body.Username + ' already exists, please try another Username');
            } else {
                let hashedPassword = Users.hashPassword(req.body.Password); // fn() hashPassword defined in models.js

                //Create the new account
                const newUser = await Users.create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthdate: dateValue
                });

                console.log("POST: Created new user: ");
                console.log(newUser);
                res.status(201).json(newUser);
            }

        } catch (err) {
            console.error(err);
            res.status(500).send('Failed POST - Unable to register new user ' + req.body.Username + ': ' + err);
        }
    });

// Update account information ---------------------------------------

/* Request body JSON should use this format:
    {
        Password: String,   (required)
        Email: String,      (required)
        Birthdate: Date
    }
*/
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    [
        //Validate Password, Email input here
        check('Password', 'Password cannot be empty').not().isEmpty(),
        check('Email', 'Email address is invalid').isEmail()
        //Date validation for Birthdate done below

    ], async (req, res) => {

        //Check for validation errors before updating account info
        if (!checkValidationResults(validationResult(req), res)) {
            return; //Response sent back to client by checkValidationResults
        }

        //Check to see if Username to update matches the info in token:
        if (req.params.Username !== req.user.Username) {
            return res.status(401).send('Permission denied');
        }

        //Birthdate validation for proper date format, validator.isDate() defaults to yyyy/mm/dd
        let dateValue = req.body.Birthdate;
        if (!validator.isDate(dateValue)) {
            dateValue = '';
        }

        //If all checks passed, then update account info
        console.log("PUT: Trying to update account information for " + req.user.Username + ": " + JSON.stringify(req.body));

        let hashedPassword = Users.hashPassword(req.body.Password); // fn() hashPassword defined in models.js

        try {
            const updatedUser = await Users.findOneAndUpdate({ Username: req.user.Username },
                {
                    $set: {
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthdate: dateValue
                    }
                },
                { new: true } //Send updated account info JSON back as response
            );
            res.status(200).json(updatedUser);

        } catch (err) {
            console.error(err);
            res.status(500).send('Failed PUT - Error updating account informaion: ' + err);
        }
    });


// Add a movie to user's favorites list ---------------------------------------
app.post('/movies/favorites/:MovieID', passport.authenticate('jwt', { session: false }),
    [
        //Validation for MovieID as alphanumeric
        check('MovieID', 'Invalid movie ID - must be alphanumeric').isAlphanumeric()
    ], async (req, res) => {

        //Check for input validation errors with MovieID prior to attempting to add the movie to favorites list
        if (!checkValidationResults(validationResult(req), res)) {
            return; //Response sent back to client by checkValidationResults
        }

        console.log('POST: Verifying MovieID ' + req.params.MovieID + ' is in the database');

        // Verify MovieID is in the database
        try {
            const movie = await Movies.findOne({ _id: req.params.MovieID });
            if (!movie) {
                return res.status(400).send('Failed POST: Unable to find movieID: ' + req.params.movieID);
            }
        } catch (err) {
            console.error('Failed POST: Error checking database for movieID ' + req.params.movieID + ': ' + err);
            return res.status(500).send('Failed POST: Error checking database for movieID ' + req.params.movieID + ': ' + err);
        }

        console.log('POST: Trying to add movie ' + req.params.MovieID + ' to favorites list for account: ' + req.user.Username);

        try {
            const updatedUser = await Users.findOneAndUpdate(
                { Username: req.user.Username },
                { $addToSet: { FavoriteMovies: req.params.MovieID } }, //$addToSet: handles if movie is already in list prior to add
                { new: true } //return the new document after update
            );
            res.status(200).json(updatedUser);

        } catch (err) {
            console.error(err);
            res.status(500).send("Failed POST: Could not add MovieID " + req.params.MovieID + " to favorites list: " + err);
        }
    });

// Remove a movie from user's favorites list -----------------------------------
app.delete('/movies/favorites/:MovieID', passport.authenticate('jwt', { session: false }),
    [
        //Validation for MovieID as alphanumeric
        check('MovieID', 'Invalid movie ID - must be alphanumeric').isAlphanumeric()
    ], async (req, res) => {

        //Check for input validation errors with MovieID prior to attempting to delete the movie from favorites list
        if (!checkValidationResults(validationResult(req), res)) {
            return; //Response sent back to client by checkValidationResults
        }

        // No need to verify if MovieID is in the database, only need to check favorite list elements

        console.log('DELETE: Trying to delete movie ' + req.params.MovieID + ' from favorites list for account ' + req.user.Username);

        try {
            const updatedUser = await Users.findOneAndUpdate(
                { Username: req.user.Username },
                { $pull: { FavoriteMovies: req.params.MovieID } }, //$pull: handles if item is not in the array
                { new: true }
            );
            res.status(200).json(updatedUser);

        } catch (err) {
            console.error(err);
            res.status(500).send("Failed DELETE - Could not remove MovieID " + req.params.MovieID + " from favorites list: " + err);
        }
    });

// Deregister a user account --------------------------------------------------

app.delete('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {

    console.log("Trying to deregister user account : " + req.user.Username);

    try {
        const deletedUser = await Users.findOneAndDelete({ Username: req.user.Username, Password: req.user.Password });

        if (!deletedUser) {
            res.status(400).send("User " + req.user.Username + " could not be found.");
        } else {
            res.status(200).send("DELETE successful : account " + req.user.Username + " has been removed.")
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed DELETE - Could not remove account " + req.user.Username + " due to server error: " + err);
    }
});


// Error handler middleware:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('The application encountered an error, please try again.');
});


const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('\n[] myFlix Movie API server is up and listening on port ' + port + '... []\n');
});