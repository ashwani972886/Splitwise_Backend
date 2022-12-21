const express = require('express');
const router = express.Router();
// Controllers
const ExpenseController = require('../Controllers/expenseController');
// Schema Validations
const { expenseSchema } = require('../middlewares/schema/expense-schema');
// Schema Validation Errors
const validateData = require('../middlewares/validator');
// Authentication middleware
const userAuth = require('../middlewares/auth');

// ROUTE 1:: Create Expense: Using POST '/expense'. (Login required)
router.post('/', [expenseSchema, validateData, userAuth] , ExpenseController.addExpense);


module.exports  = router;