const express = require('express');
const app = express();

const fs = require('fs'); 
const path = require('path');
const morgan = require('morgan');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

// DB connection to MongoDB
mongoose.connect('mongodb://localhost:27017/myFlix', {});

// Express middleware:
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // to use public folder for serving static html files

// Logging stream to log.txt with append flag set
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});
app.use(morgan('common', {stream: accessLogStream}));

app.use(bodyParser.json()); // parse request bodies into JSON format

let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport.js');



// Requests & handling -----------------------------------------------------
app.get('/', (req, res) => {
    res.status(200).send('This will be the homepage for my API!');
});

app.get('/documentation', (req, res) => {
    console.log('The sending file for /documentation request path: '+ path.join(__dirname, 'public', 'documentation.html'));
    res.sendFile(path.join(__dirname, 'public', 'documentation.html'));
});

// Get a list of all movies (titles) ---------------------------------------
app.get('/movies', passport.authenticate('jwt', {session:false}), async (req, res) => {
    console.log("Request for list of all movies...");
    await Movies.find()
        .then((responseMovies) => {
            if(!responseMovies){
                return res.status(404).send('Failed GET - Could not retrieve movies: '+responseMovies);
            } else {
                let listOfAllMovies = {"movies": []};
                responseMovies.forEach((movieItem) => {
                    console.log("Trying to add movie title to list : "+movieItem.Title);
                    listOfAllMovies.movies.push(movieItem.Title); //Push movie titles onto array of movies
                });
                return res.status(200).json(listOfAllMovies);
            }
        }).catch((err)=> {
            console.error(err);
            return res.status(500).send('Failed GET - Server error retreiving movie list: '+err);
        });

});

// Get information about a movie by title ---------------------------------------
app.get('/movies/:Title', passport.authenticate('jwt', {session:false}), async (req, res) => {
    console.log('GET : Searching for info on movie: '+req.params.Title);
    await Movies.findOne({Title: req.params.Title})
        .then((movieFound) => {
            
            // API response does not include embedded documents for Genre/Director so 
            //  a custom JSON response is built here omitting extra data.
            let trimmedJsonString = '{';

            trimmedJsonString += '"Title": "'+movieFound.Title+'",';
            trimmedJsonString += '"ReleaseYear": "'+movieFound.ReleaseYear+'",';
            trimmedJsonString += '"Rating": "'+movieFound.Rating+'",';
            trimmedJsonString += '"Description": "'+movieFound.Description+'",';
            trimmedJsonString += '"Director": "'+movieFound.Director.Name+'",';
            trimmedJsonString += '"Genre": "'+movieFound.Genre.Name+'",';

            // Rebuild the Actors array with proper JSON syntax
            let actorsArray = '[';
            let firstIndex = true;
            movieFound.Actors.forEach((actor) => {
                if(firstIndex) { 
                    actorsArray += '"'+actor+'"';
                    firstIndex = false;
                } else {
                    actorsArray += ',"'+actor+'"';
                }
            });
            actorsArray += ']';

            //console.log("actorArray is : "+actorsArray);

            trimmedJsonString += '"Actors": '+actorsArray+',';
            trimmedJsonString += '"ImageURL": "'+movieFound.ImageURL+'",';
            trimmedJsonString += '"Featured": "'+movieFound.Featured+'"}';

            //console.log("Trimmed JSON string is:");
            //console.log(trimmedJsonString);

            console.log("Parsing into JSON object...");
            var parsedJson = JSON.parse(trimmedJsonString);
            console.log(parsedJson);

            res.status(200).json(parsedJson);
        }).catch((err) => {
            console.error(err);
            res.status(500).send("Failed GET - Error looking for movie details about :"+req.params.Title+" with error : "+err);
        });
});

// Get information about a genre by name ---------------------------------------
app.get('/genre/:Name', passport.authenticate('jwt', {session:false}), async (req, res) => {
    console.log('Looking for information about the movie genre '+req.params.Name);
    await Movies.findOne({"Genre.Name" : req.params.Name})
        .then((genreFoundInMovie) => {
            res.status(200).json(genreFoundInMovie.Genre);
        }).catch((err) => {
            console.error(err);
            res.status(500).send("Failed GET : Could not get info about genre "+req.params.Name+" with error : "+err);
        });
});

// Get information about a director by name -------------------------------------
app.get('/director/:Name', passport.authenticate('jwt', {session:false}), async (req, res) => {
    console.log('Looking for information about director '+req.params.Name);
    await Movies.findOne({"Director.Name" : req.params.Name})
        .then((directorFoundInMovie) => {
            res.status(200).json(directorFoundInMovie.Director);
        }).catch((err) => {
            console.error(err);
            res.status(500).send("Failed GET : Could not get info about director "+req.params.Name+" with error : "+err);
        });
});

// Register a new user account --------------------------------------------------

/* Request body JSON should use this format:
    {
        Username: String,
        Password: String,
        Email: String,
        Birthdate: Date
    }
}*/
app.post('/users', async (req, res) => {
    console.log('Trying to register a user: ');
    console.log(JSON.stringify(req.body));
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users.create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthdate: req.body.Birthdate
          })
          .then((user) =>{
            res.status(201).json(user);
          }).catch((error) => {
              console.error(error);
              res.status(500).send('Error trying to register new user: ' + error);
          });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Failed POST - Unable to register new user '+req.body.Username+': ' + error);
      });
  });

// Update account information ---------------------------------------

/* Request body JSON should use this format:
    {
        Username: String,   (required)
        Password: String,   (required)
        Email: String,      (required)
        Birthdate: Date
    }
*/
app.put('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {
    console.log("Trying to update account information for "+req.params.Username+": "+JSON.stringify(req.body));

    let passedChecks = true;

    //Check to see if Username to update matches the info in token:
    if(req.user.Username !== req.params.Username){
        passedChecks = false;
        return res.status(400).send('Permission denied');
    }

    //Check to make sure new username is not already taken by an existing account:
    await Users.findOne({Username:req.body.Username})
        .then((user)=>{
            if(user){
                passedChecks = false;
                console.log('New username ['+req.body.Username+'] is unavailable.')
                return res.status(400).send('Username ['+req.body.Username+'] is already taken, please try a different username.');
            }
        }).catch((err) => {
            passedChecks = false;
            console.error('Error while checking username availability: '+err);
            return res.status(400).send(err);
        });

        //If all checks passed, then update account info
        if(passedChecks){
            console.log('Passed username checks: username matched & new username is available.');
            await Users.findOneAndUpdate({ Username: req.params.Username }, 
                { $set: {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthdate: req.body.Birthdate
                    }
                },
                { new: true } //Send updated account info JSON back as response.
        
            ).then((updatedUser) => {
                res.status(200).json(updatedUser);
            }).catch((err) => {
                console.error(err);
                res.status(500).send('Failed PUT - Error updating account informaion: ' + err);
              });
        }
});


// Add a movie to user's favorites list ---------------------------------------

/* Request body JSON should use this format:
    {
        Username: String,   (required)
        Password: String,   (required)
    }
*/
app.post('/movies/favorites/:MovieID', passport.authenticate('jwt', {session:false}), async (req, res) => {
    console.log('Trying to add movie '+req.params.MovieID+' to favorites list for account: '+req.body.Username);

    // Check for valid MovieID here???
    // Check if MovieID already in favorites list???

    await Users.findOneAndUpdate({Username: req.body.Username, Password: req.body.Password},
        {$push: {FavoriteMovies: req.params.MovieID}},
        {new:true}
    ).then((updatedUser) => {
        res.status(200).json(updatedUser);
    }).catch((err) => {
        console.error(err);
        res.status(500).send("Failed POST - Could not add MovieID "+req.params.MovieID+" to favorites list: "+err);
    });
});

// Remove a movie from user's favorites list -----------------------------------

/* Request body JSON should use this format:
    {
        Username: String,   (required)
        Password: String,   (required)
    }
*/

app.delete('/movies/favorites/:MovieID', passport.authenticate('jwt', {session:false}), async (req, res) => {
    console.log('Trying to delete movie '+req.params.MovieID+' from favorites list for account '+req.body.Username);

    // Check for valid MovieID here???
    // Check if MovieID is NOT in favorites list???

    await Users.findOneAndUpdate({Username: req.body.Username, Password: req.body.Password},
        {$pull: {FavoriteMovies: req.params.MovieID}},
        {new:true}
    ).then((updatedUser) => {
        res.status(200).json(updatedUser);
    }).catch((err) => {
        console.error(err);
        res.status(500).send("Failed DELETE - Could not remove MovieID "+req.params.MovieID+" from favorites list: "+err);
    });
});

// Deregister a user account --------------------------------------------------

/* Request body JSON should use this format:
    {
        Username: String,   (required)
        Password: String,   (required)
    }
*/

app.delete('/users', passport.authenticate('jwt', {session:false}), async (req, res) => {
    console.log("Trying to deregister user account : "+req.body.Username);
    await Users.findOneAndDelete({Username: req.body.Username, Password: req.body.Password})
        .then((deletedUser) => {
            if(!deletedUser) {
                res.status(400).send("User "+req.body.Username+" could not be found.");
            } else {
                res.status(200).send("DELETE successful : account "+req.body.Username+" has been removed.")
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).send("Failed DELETE - Could not remove account "+req.body.Username+" due to server error: "+err);
        });
});


// Error handler middleware:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('The application encountered an error, please try again.');
});


app.listen(8080, () => {
    console.log('myFlix Movie API server is up and listening on port 8080...');
});