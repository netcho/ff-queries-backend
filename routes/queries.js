const { ObjectID } = require('mongodb');
const math = require('mathjs');
const db = require('../db');

function getCompaniesFromActivities(query) {
    let companies = '';

    query.activities.forEach((activity, index, activities) => {
        if(!companies.includes(activity.company)) {
            companies += activity.company;

            if(index !== (activities.length -1)) {
                companies += ', ';
            }
        }
    });

    return companies;
}

function calculateTotalSumVAT(query) {
    let totalSum = 0;

    query.activities.forEach((activity) => {
        let priceVAT = math.multiply(activity.price, 1.2);
        totalSum += math.round(priceVAT, 2);
    });

    return math.round(totalSum, 2);
}

function list(req, res) {
    const queries = db.getDatabase().collection('queries');
    queries.find(req.user.role === 'admin' ? {} : {createdBy: req.user._id }, { sort: [['_id', -1]]}).toArray().
    then((queries) => {
        if(queries) {
            queries.forEach((query) => {
                query.totalSum = calculateTotalSumVAT(query);
            });

            res.send(200, queries);
        }
        else {
            res.send(200, []);
        }
    }, (err) => {
        res.send(500);
    });
}

function fetch(req, res) {
    const queries = db.getDatabase().collection('queries');
    queries.findOne({_id: new ObjectID(req.params.id)}).then((query) => {
        if(query) {
            query.companies = getCompaniesFromActivities(query);
            query.totalSum = calculateTotalSumVAT(query);
            res.send(200, query);
        }
        else {
            res.send(404);
        }
    }, (err) => {
        res.send(500);
    });
}

function add(req, res) {
    const queries = db.getDatabase().collection('queries');
    queries.insertOne(req.body).then((result) => {
        if(result.insertedCount) {
            res.send(201);
        }
        else {
            res.send(204);
        }
    }, err => res.send(500));
}

function update(req, res) {
    const queries = db.getDatabase().collection('queries');
    queries.updateOne({_id: new ObjectID(req.params.id)}, { $set: req.body }).then((result) => {
        if (result.modifiedCount) {
            res.send(200);
        }
        else {
            res.send(404);
        }
    }).catch((err) => {
        console.error(err);
        res.send(500)
    });
}

function remove(req, res) {
    let queries = db.getDatabase().collection('queries');
    queries.deleteOne({_id: new ObjectID(req.params.id)}).then((result) => {
        if (result.deletedCount) {
            res.send(204);
        }
        else {
            res.send(404);
        }
    }).catch((err) => {
        console.error(err);
        res.send(500)
    });
}

function listCategories(req, res) {
    const queries = db.getDatabase().collection('queries');
    queries.distinct('category', {}).then((result) => {
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

module.exports = { list, add, fetch, update, remove, listCategories };