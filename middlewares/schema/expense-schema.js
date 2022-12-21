const {check} = require('express-validator');

const expenseSchema = [
    check('type', 'Please select valid expense type')
    .isIn(['Group', 'Friend']),
    check('desc', "Please enter expense description")
    .exists({ checkFalsy: true}),
    check('amount', 'Please enter expense amount')
    .exists({ checkFalsy: true}),
    check('category', 'Please enter expense category')
    .exists({ checkFalsy: true}),
    check('split_method', 'Please enter a valid split method')
    .exists({ checkFalsy: true})
    .bail()
    .isIn(['equally', 'exact_amounts', 'pecentage', 'share', 'adjustment', 'reimbursment', 'itemised']),
    // check('paid_by', 'Please select who paid the expense')
    // .exists({ checkFalsy: true})
    // .bail()
    // .isArray({min:1}),
    // check('paid_by.*.user')
    // .exists({checkFalsy: true})
    // .withMessage('Please enter valid user id of payee'),
    // check('paid_by.*.amount')
    // .exists({checkFalsy: true})
    // .withMessage('Please enter valid amount paid'),
    // check('split_between', 'Please select who paid the expense')
    // .exists({ checkFalsy: true})
    // .bail()
    // .isArray({min:1}),
    // check('paid_by.*.user')
    // .exists({checkFalsy: true})
    // .withMessage('Please enter valid user id of payee'),
    // check('paid_by.*.amount')
    // .exists({checkFalsy: true})
    // .withMessage('Please enter valid amount paid')
    
];

module.exports = {
    expenseSchema
};