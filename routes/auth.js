const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');

function login(req, res) {
    let database = db.getDatabase();
    let users = database.collection('users');
    users.findOne({username: req.body.username}).
    then((user => {
        if (user) {
            if(bcrypt.compareSync(req.body.password, user.hash)) {
                delete user.hash;
                let token = jwt.sign(user, '848f5468342ff453adqdjio', { expiresIn: '1w'});
                res.send(200, {user: user, token: token});
            }
            else {
                res.send(401);
            }
        }
        else {
            res.send(404);
        }
    }));
}

function authenticate(req, res, next) {
    if (!req.header('Authorization')) {
        res.send(401);
        return;
    }

    try {
        req.user = jwt.verify(req.header('Authorization'), '848f5468342ff453adqdjio');
        next();
    } catch (e) {
        res.send(401);
    }
}

module.exports = { login, authenticate };