const {check} = require('express-validator');

const groupSchema = [
    check('groupName', "Group name can't be blank")
    .exists({ checkFalsy: true}),
    check('members.*')
    .exists({checkFalsy: true})
    .isEmail()
    .withMessage('Please pass valid email to add to group')
    .normalizeEmail(),
    check('groupType', 'Please enter a valid groupType!')
    .isIn(['Home', 'Trip', 'Couple', 'Other'])
];

module.exports = {
    groupSchema
};