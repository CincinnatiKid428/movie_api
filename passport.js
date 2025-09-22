//File: /passport.js - Holds authentication logic for HTTP Basic Auth and subsequent requests using JWT.

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');

const DEBUG_LOG = false; //controls logging

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt; //Used to pull JWT from request header

//HTTP Basic Authentication (for login)
passport.use(new LocalStrategy(
    {
        usernameField: 'Username',
        passwordField: 'Password'
    },
    async (username, password, callback) => {
        DEBUG_LOG && console.log(`Authenticating username/passowrd : ${username} ${password}`);
        await Users.findOne({ Username: username })
            .then((user) => {
                //Valid username check
                if (!user) {
                    console.error('Incorrect username [' + username + '] no user found.');
                    return callback(null, false, { message: 'Incorrect username/password.' });
                }
                //Valid password check
                if (!user.validatePassword(password)) {
                    console.error('Incorrect password');
                    return callback(null, false, { message: 'Incorrect password.' });
                }

                DEBUG_LOG && console.log('Found user" ' + user);
                return callback(null, user);
            })
            .catch((err) => {
                if (err) {
                    console.error(err);
                    return callback(err);
                }
            })
    }
));

//JWT-based authentication (subsequent requests after login authentication)
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
},
    async (jwtPayload, callback) => {
        return await Users.findById(jwtPayload._id)
            .then((user) => {
                return callback(null, user);
            })
            .catch((err) => {
                return callback(err);
            });
    }
));