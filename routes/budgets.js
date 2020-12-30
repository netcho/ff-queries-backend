const moment = require('moment');
const db = require('../db');

const listPipeline = [
    { $match: { isUrgent: false } },
    { $unwind: '$activities' },
    { $project: {
        payDate: true,
        "activities.price": true,
        year: {
            $year: {
                    $toDate: "$payDate"
                }
            }
    }},
    { $group: {
        _id: { $add: [ { $isoWeek: { $toDate: '$payDate' } }, { $cond: [ { $gt: [ { $isoDayOfWeek: { $toDate: '$payDate' } }, 4 ] }, 1, 0 ] } ] },
        totalSum: {
            $sum: {
                $round: [ { $multiply: [ '$activities.price', 1.2 ] }, 2 ]
            }
        },
        year: { $min: '$year' }
    }
    },
    { $project: {
        _id: true,
        year: true,
        totalSum: { $ceil: '$totalSum' }
        }
    },
    { $sort: {
        year: -1,
        _id: -1
        }
    }]

const fetchPipeline = [
    { $addFields: {
        totalSum: {
            $reduce: {
                input: '$activities',
                initialValue: 0,
                in: {
                    $add: [ { $round: [ { $multiply: [ '$$this.price', 1.2 ] }, 2 ] }, '$$value' ]
                }
            }
        },
        places: {
            $reduce: {
                input: '$activities',
                initialValue: [],
                in: {
                    $concatArrays: [ '$$value', { $setDifference: [ { $split: [ '$$this.places', ', ' ] }, '$$value' ] } ]
                }
            }
        }
    }
    },
    { $set: {
        totalSum: { $ceil: '$totalSum' }
    }
    },
    { $sort: {
        _id: 1
    }
    },
    { $group: {
        _id: null,
        queries: { $addToSet: '$$ROOT' },
        totalSum: { $sum: '$totalSum' }
    }
    }
]

function list(req, res) {
    const queries = db.getDatabase().collection('queries');
    queries.aggregate(listPipeline).toArray().
    then((queries) => {
        if (queries) {
            res.send(200, queries);
        }
        else {
            res.send(200, []);
        }
    }).
    catch((err) => {
        res.send(500);
    });
}

function fetch(req, res) {
    const queries = db.getDatabase().collection('queries');
    let lastDate = moment({ year: parseInt(req.query.year, 10)});
    //lastDate.set();
    //lastDate.year(parseInt(req.query.year, 10));
    lastDate.week(parseInt(req.query.week, 10) === 1 ? 2 : req.query.week);
    lastDate.day('Thursday');
    let firstDate = moment({ year: parseInt(req.query.year, 10)});
    //firstDate.set();
    //firstDate.year(parseInt(req.query.year, 10));
    firstDate.week(parseInt(req.query.week, 10) === 1 ? 1 : req.query.week - 1);
    firstDate.day('Friday');
    let pipeline = [ { $match: { payDate: { $gte: firstDate.format('YYYY-MM-DD'), $lte: lastDate.format('YYYY-MM-DD') }, isUrgent: false } } ];
    queries.aggregate(pipeline.concat(fetchPipeline)).next().
    then((budget) => {
        if (budget) {
            res.send(200, budget);
        }
        else {
            res.send(200, {});
        }
    }).
    catch((err) => {
        res.send(500);
    });
}

module.exports = { list, fetch };