const {check} = require('express-validator');

const groupSchema = [
    check('groupName', "Group name can't be blank")
    .exists({ checkFalsy: true}),
    check('members')
    .exists({ checkFalsy: true})
    .withMessage( 'Please select atleast 1 member to add to the group')
    .bail()
    .isArray({min:1})
    .withMessage('Please pass the member detail into array form'),
    check('members.*')
    .exists({checkFalsy: true})
    .isEmail().normalizeEmail()
    .withMessage('Please pass valid email of users to add to group'),
    check('groupType', 'Please enter a valid groupType!')
    .isIn(['Home', 'Trip', 'Couple', 'Other'])
];

module.exports = {
    groupSchema
};