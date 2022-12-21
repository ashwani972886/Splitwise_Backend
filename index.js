const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
//Dotenv file configuration
require('dotenv').config();
const port = process.env.PORT;

// Database Connection
require('./init/db')();

// Parse body
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cors());

// Welcome
app.get('/', async(req, res) => {
    res.send("Woohoo! You are connected!");
});

require('./init/routes')(app);

// Initiate Server
app.listen(port, error => {
    if(error) throw error;
    console.log(`Server is active at ${port}`);
});