const db = require('../db');

function addCategorySum(category) {
    return {
        $sum: {
            $reduce: {
                input: "$activities",
                initialValue: 0,
                in: {
                    $add: [ '$$value', { $cond: { if: { $in: [ category, "$type" ] }, then: { $round: [ { $multiply: [ '$$this.price', 1.2 ] }, 2 ] }, else: 0 } } ]
                }
            }
        }
    }
}

function processInquiry(req, res) {
    const queries = db.getDatabase().collection('queries');
    let pipeline = [{ $addFields: { categorySubcode: "$category.subcode" } }, { $match: { payDate: { $gte: req.query.startDate, $lte: req.query.endDate } } }];

    if (req.query.hasOwnProperty('categorySubcodes')) {
        pipeline.push({ $match: { $expr: {  $in: [ "$categorySubcode", req.query.categorySubcodes ] } } });
    }

    if (req.query.hasOwnProperty('companies')) {
        pipeline.push({ $match: { $expr: { $in: [ "$contractor", req.query.companies ] } } });
    }

    pipeline.push({
        $group: {
            _id: "$contractor",
            investmentSum: addCategorySum('Investment'),
            repairsSum: addCategorySum('Repair'),
            supportSum: addCategorySum('Support'),
            transportSum: addCategorySum('Transport')
        }
    });

    queries.aggregate(pipeline).toArray().then((inquiry) => {
        if (inquiry) {
            res.send(200, inquiry);
        }
        else {
            res.send(200, []);
        }
    }).catch((err) => {
        res.send(500);
        console.error(err);
    });
}

module.exports = { processInquiry };
