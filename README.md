# movie_api

## 🎞 Description
To build the server-side component of a “movies” web application. The web
application will provide users with access to information about different
movies, directors, and genres. Users will be able to sign up, update their
personal information, and create a list of their favorite movies.

## 🎬 Projects Using *movie_api*:
- [myFlix-client(Matinee)](https://github.com/CincinnatiKid428/myFlix-client)
- [myFlix-Angular-client(Matinee)](https://github.com/CincinnatiKid428/myFlix-Angular-client)

## 📌 Features
- Return a list of ALL movies to the user
- Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by title to the user
- Return data about a genre (description) by name/title (e.g., “Thriller”)
- Return data about a director (bio, birth year, death year) by name
- Allow new users to register
- Allow users to update their user info (username, password, email, date of birth)
- Allow users to add a movie to their list of favorites
- Allow users to remove a movie from their list of favorites
- Allow existing users to deregister

## 🛠 How to Set Up Project Locally:
1. Clone repository
2. From project root, run `npm install` to install dependencies
3. Create a MongoDB (locally or online using [AtlasDB](https://www.mongodb.com/products/platform/atlas-database)
4. Set environment variables `DB_CONNECTION_URI` to your MongoDB and `PORT` to a desired port number your local server will listen on (defaults to port 8080 if not defined).  Mongoose will use these environment variables to connect the backend to the database.
5. Run `node index.js` to start the local dev server.

## 🌐 Online Hosting
This project is hosted online using [Heroku](https://www.heroku.com).  You can host there or choose another hosting site if you would like to make the *movie_api* available online.  Environment variables will need to be configured appropriately in the hosting environment.

## 🎛 Usage

Use the endpoints in your own application that communicate with *movie_api* as noted in the documentation below.  Users will require authentication to use the endpoints and will be granted an auth token after successful registration/login.  The  API documentation defines which endpoints require a  `JSON` request body and what their response `JSON` will be if the request completes successfully.  

🔐 You will need to pass the bearer token header with each request following authentication.  For example, the *myFlix-Angular-client* project uses this function to handle the headers:

```ts
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
```
⚠️*Note: This will be sufficient for all API endpoints EXCEPT deregistration, you will need to add 'Response-Type': 'text' for this endpoint's header.*

📑 For details on the API, see [movie_api Documentation](https://fast-taiga-09096-54ce00eca848.herokuapp.com/documentation).
<br>

## 🤖 Technologies Used
- JavaScript
- Express
- Mongoose
- [Postman](https://www.postman.com) (Tested API endpoints)
- [JSDoc](https://jsdoc.app) (Generated documentation)
- [ChatGPT](https://chatgpt.com)

### <ins>Dependencies</ins>
- [MongoDB](https://www.mongodb.com/products/platform/atlas-database)
