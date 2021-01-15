const restify = require('restify');
const createLightship = require('lightship').createLightship;
const corsMiddleware = require('restify-cors-middleware');
const auth = require('./routes/auth');
const queries = require('./routes/queries');
const budgets = require('./routes/budgets');
const contragents = require('./routes/contragents');
const inquiry = require('./routes/inquiry');
const users = require('./routes/users');
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
server.get('/query/:id', auth.authenticate, queries.fetch);
server.put('/query/:id', auth.authenticate, queries.update);
server.del('/query/:id', auth.authenticate, queries.remove);

server.get('/contragents', auth.authenticate, contragents.list);
server.get('/categories', auth.authenticate, queries.listCategories);

server.get('/budgets', auth.authenticate, budgets.list);
server.get('/budgets/urgent', auth.authenticate, budgets.listUrgent);
server.get('/budget', auth.authenticate, budgets.fetch);

server.get('/inquiry', auth.authenticate, inquiry.processInquiry);

server.post('/login', auth.login);

server.get('/users', auth.authenticate, users.list);
server.post('/user', auth.authenticate, users.add);
server.get('/user/:id', auth.authenticate, users.fetch);
server.put('/user/:id', auth.authenticate, users.update);

server.get('/users/permissions', auth.authenticate, users.listPermissions);

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
