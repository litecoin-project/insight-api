/* @flow */

var config = require('config');
var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');
const port = process.env.PORT || config.PORT;
const db = mongoose.connection;

// for testing
if (mongoose.connection.readyState === 0) {
  const dbOptions = {
    server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  };

  mongoose.connect(config.DBHost, dbOptions);
}

db.on('error', console.error.bind(console, 'connection error:'));
db.once('openUri', () => {
  console.info(`Connected to DB @ ${config.DBHost}`);
});
