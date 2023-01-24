const swaggerAutogen = require('swagger-autogen');

const outputFile = './swagger_output.json';

const endPointsFile = ['./init/routes.js'];

const doc = {
    info: {
        version: '1.0.0',
        title: "Splitwise Backend",
        description: "Splitwise API  documentation"
    },
    host: 'localhost:5000',
    basePath: '/',
    schemes: [
        'http',
        'https'
    ]
};

swaggerAutogen(outputFile, endPointsFile, doc).then(() => {
    require('./index.js');
});