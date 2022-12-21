const express = require('express');
const router = express.Router();
// Controllers
const GroupController = require('../Controllers/groupController');
// Schema Validations
const { groupSchema } = require('../middlewares/schema/group-schema');
// Schema Validation Errors
const validateData = require('../middlewares/validator');
// Authentication middleware
const userAuth = require('../middlewares/auth');

// ROUTE 1:: Create a new group: Using POST '/group'. (Login required)
router.post('/',[ groupSchema, validateData, userAuth], GroupController.createGroup);

//ROUTE 2:: Get user details: Using GET '/group'. (Login required)
router.get('/', userAuth, GroupController.getGroupList);


module.exports  = router;