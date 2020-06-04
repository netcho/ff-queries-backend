const db = require('../db');

function list(req, res) {
    const queries = db.getDatabase().collection('queries');
    queries.distinct('contractor', {}).then((result) => {
        if (result) {
            res.send(200, result);
        }
        else {
            res.send(200, []);
        }
    }).catch((err) => {
        res.send(500);
    });
}

module.exports = { list };