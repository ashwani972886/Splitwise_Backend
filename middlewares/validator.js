const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
    // console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        // console.log(errors);
        const errArr = [];
        for(let i = 0; i < errors.errors.length; i++) {
            let j = i+1;
            // errArr.push(`${j}.) ${errors.errors[i].msg}`);
            errArr.push(`${errors.errors[i].msg}`);

        }
        return res.status(400).send({ error: errArr });
    } else {
        next();
    }
};