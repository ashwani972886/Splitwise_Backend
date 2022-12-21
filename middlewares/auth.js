const jwt = require('jsonwebtoken');
const jwt_secret = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    try {
        if(!req.headers.authorization) {
            return res.status(401).send({ error: 'Please login with valid credentials!' });
        } else {
            const auth = req.headers.authorization;
            const token = auth.split(' ')[1];
            const data = jwt.verify(token, jwt_secret);
            req.user = data.id;
            next();
        }
    } catch (err) {
        return   res.status(401).send({ error: 'Please login with valid credentials!' });
    }
};