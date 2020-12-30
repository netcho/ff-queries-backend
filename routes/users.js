const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const db = require('../db');

function list(req, res) {
    const users = db.getDatabase().collection('users');
    users.find({}, { projection: { hash: 0 }}).toArray().
    then((users) => {
       res.send(users);
    }, (err) => {
        res.send(500);
    });
}

function fetch(req, res) {
    const users = db.getDatabase().collection('users');
    users.findOne({_id: new ObjectID(req.params.id)}, { projection: { hash: 0 }}).
    then((user) => {
        if (user) {
            res.send(user);
        }
        else {
            res.send(404);
        }
    }, (err) => {
        res.send(500);
    });
}

function add(req, res) {
    const users = db.getDatabase().collection('users');
    users.insertOne(req.body).then((result) => {
       if (result.insertedCount) {
           res.send(201);
       }
       else {
           res.send(204);
       }
    }, (err) => {
        res.send(500);
    });
}

function update(req, res) {
    const users = db.getDatabase().collection('users');

    if(req.body.hasOwnProperty('password')) {
        req.body.hash = bcrypt.hashSync(req.body.password, 8);
        delete req.body.password;
    }

    users.updateOne({_id: new ObjectID(req.params.id)}, {$set: req.body}).
    then((result) => {
        if (result.matchedCount) {
            if (result.modifiedCount) {
                res.send(200);
            }
            else {
                res.send(204);
            }
        }
        else {
            res.send(404);
        }
    }, (err) => {
        res.send(500);
    });
}

function listPermissions(req, res) {
    const permissions = db.getDatabase().collection('permissions');
    permissions.find().toArray().
    then((result) => {
        res.send(result);
    });
}

module.exports = { list, fetch, add, update, listPermissions };