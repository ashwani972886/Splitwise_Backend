const User = require('../routes/user');
const Group = require('../routes/group');
const Expense = require('../routes/expenses');

module.exports = app => {
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