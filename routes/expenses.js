const express = require('express');
const router = express.Router();
// Controllers
const ExpenseController = require('../Controllers/expenseController');
// Schema Validations
const { expenseSchema } = require('../middlewares/schema/expense-schema');
const {settlementSchema} = require('../middlewares/schema/settlement-schema');
// Schema Validation Errors
const validateData = require('../middlewares/validator');
// Authentication middleware
const userAuth = require('../middlewares/auth');

// ROUTE 1:: Create Expense: Using POST '/expense'. (Login required)
router.post('/', [expenseSchema, validateData, userAuth] , ExpenseController.addExpense);

// ROUTE 2:: Delete Expense: Using DELETE '/expense'. (Login required)
router.delete('/:expenseId', userAuth, ExpenseController.deleteExpense);

// ROUTE 3:: Update Expense: Using PUT '/expense/update'. (Login required)
router.put('/update/:expenseId', [expenseSchema, validateData, userAuth], ExpenseController.updateExpense);

// ROUTE 4: Settle Expense: Using PUT '/expense/settle'. (Login Required)
router.put('/settle',[settlementSchema, validateData, userAuth], ExpenseController.settleExpense);

module.exports  = router;