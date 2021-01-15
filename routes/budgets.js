const moment = require('moment');
const db = require('../db');

const listPipeline = [
    { $unwind: '$activities' },
    { $project: {
        payDate: true,
        "activities.price": true,
    }},
    { $group: {
        _id: '$payDate',
        totalSum: {
            $sum: {
                $round: [ { $multiply: [ '$activities.price', 1.2 ] }, 2 ]
            }
        },
        year: { $min: { $year: { $toDate: '$payDate' } } },
        week: { $min: { $isoWeek: { $toDate: '$payDate' } } }
        }
    },
    { $project: {
        id: true,
        year: true,
        week: true,
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
    let matchStage = [ { $match: { isUrgent: false } } ];
    queries.aggregate(matchStage.concat(listPipeline)).toArray().
    then((queries) => {
        if (queries) {
            res.send(200, queries);
        }
        else {
            res.send(200, []);
        }
    }).
    catch((err) => {
        console.error(err);
        res.send(500);
    });
}

function fetch(req, res) {
    const queries = db.getDatabase().collection('queries');

    let pipeline = [];

    if (req.query.isUrgent === 'true') {
        pipeline.push({$match: { payDate: req.query.payDate, isUrgent: true } });
    }
    else {
        let lastDate = moment();
        let year = parseInt(req.query.year, 10);
        let week1 = parseInt(req.query.week, 10);
        lastDate.set('year', year);
        lastDate.isoWeek(week1);
        lastDate.isoWeekday(4);
        pipeline.push({ $match: { payDate: lastDate.format('GGGG-MM-DD'), isUrgent: false } });
    }
    queries.aggregate(pipeline.concat(fetchPipeline)).next().
    then((budget) => {
        if (budget) {
            res.send(200, budget);
        }
        else {
            res.send(200, []);
        }
    }).
    catch((err) => {
        res.send(500);
        console.error(err);
    });
}

function listUrgent(req, res) {
    const queries = db.getDatabase().collection('queries');
    let matchStage = [ { $match: { isUrgent: true } } ];
    queries.aggregate(matchStage.concat(listPipeline)).toArray().
    then((budgets) => {
        if (budgets) {
            let lastYear = 0;
            let lastWeek = 0;
            let count = 1;

            let result = budgets.map((budget) => {
                let budgetNumbered = Object.assign({}, budget);
                if (lastYear === budget.year) {
                    if (lastWeek === budget.week) {
                        count++;
                    }
                    else {
                        count = 1;
                        lastWeek = budget.week;
                    }
                }
                else {
                    count = 1;
                    lastYear = budget.year;
                }

                budgetNumbered.number = count;

                return budgetNumbered;
            })

            res.send(200, result);
        }
        else {
            res.send(200, []);
        }
    }).
    catch((err) => {
        res.send(500);
        console.error(err);
    })
}

module.exports = { list, listUrgent, fetch };
