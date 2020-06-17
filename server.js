const restify = require('restify');
const createLightship = require('lightship').createLightship;
const corsMiddleware = require('restify-cors-middleware');
const auth = require('./routes/auth');
const queries = require('./routes/queries');
const budgets = require('./routes/budgets');
const contragents = require('./routes/contragents');
const database = require('./db');

const cors = corsMiddleware({
    origins: ["*"],
    allowHeaders: ["Authorization"],
    exposeHeaders: ["Authorization"]
});

let server = restify.createServer({
    name: 'ff-queries-backend',
    version: '1.0.0'
});

server.pre(restify.plugins.pre.userAgentConnection());
server.pre(cors.preflight);

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(cors.actual);

server.get('/queries', auth.authenticate, queries.list);
server.post('/query', auth.authenticate, queries.add);
server.put('/query/:id', auth.authenticate, queries.update);
server.get('/query/:id', auth.authenticate, queries.fetch);

server.get('/contragents', auth.authenticate, contragents.list);

server.get('/budgets', auth.authenticate, budgets.list);
server.get('/budget', auth.authenticate, budgets.fetch);

server.post('/login', auth.login);

let lightship = createLightship();

lightship.registerShutdownHandler(() => {
    server.close();
    database.closeDatabase();
})

database.initDatabase().then(() => {
    server.listen(8080, () => {
        lightship.signalReady();
        console.log('%s listening at %s', server.name, server.url);
    });
});