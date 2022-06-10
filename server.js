const express = require('express');
const mongoose = require('mongoose');
const bodyParser =  require('body-parser'); //Convert json to js object
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const app = express();

//import routes
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/userRoutes');

//app middleware
app.use(bodyParser.json());
app.use(cors());

//route middleware
app.use(postRoutes);
//app.use(userRoutes);
app.use(userRoutes);

const PORT = 8000;

const DB_URL = 'mongodb+srv://chathurika:chathurika123@nodeauth.eqnj73n.mongodb.net/NodeAuth?retryWrites=true&w=majority';

mongoose.connect(DB_URL)
.then( () => {
    console.log('Database connected');
})
.catch( (err) => console.log('Database error', err));

app.listen(PORT, () => {
    console.log(`App is running on ${PORT}`);
});