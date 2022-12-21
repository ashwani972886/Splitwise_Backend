module.exports = (data) => {
    return async(req, res, next) => {
        try {
            await data(req, res, next);
        } catch (err) {
            console.log(err);
            return res.status(500).send({ error: "Internal server error!" });
            // next(err);
        }
    };
};