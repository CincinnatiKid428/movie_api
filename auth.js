const jwtSecret = 'your_jwt_secret'; // Must match the key used in the JWTStrategy

const jwt = require('jsonwebtoken');
const passport = require('passport');

require('./passport.js'); // Local passport file


let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // Username to encode in the JWT
    expiresIn: '7d',        // Specifies token expiration: 7 days
    algorithm: 'HS256'      // Algorithm used to sign/encode the values of the JWT
  });
}


/* Login endpoint - POST method */
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Could not authenticate.',
          user: user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
}