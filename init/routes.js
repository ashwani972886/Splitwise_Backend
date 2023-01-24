const User = require('../routes/user');
const Group = require('../routes/group');
const Expense = require('../routes/expenses');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');

module.exports = app => {

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
    // Redirection to User Routes
    app.use('/user', User);
    // Redirection to Group Routes
    app.use('/group', Group);
    // Redirection to Expenses Routes
    app.use('/expense', Expense);

      // Throw error while page not found
      app.use((req, res) => {
        return res.status(404).send({message: 'Page not found! Please check your URL!'});
      });
};