const fs = require('fs');
const process = require('process');
const conv = require('binstring');
const Database = require('./Database');

const firstName = process.argv[2];
const tableName = 'userData';

const connectionConfig = {
    host: 'localhost',
    user: 'admin',
    password: 'admin',
    database: 'myDB'
}

const dbConnection = new Database(connectionConfig);

dbConnection.query(`SELECT FROM_BASE64(pdf) AS user FROM ${tableName} WHERE firstName='${firstName}'`)
    .then((rows) => {
        let data = rows[0].user;
        let buf = conv(data, { in: 'binary', out: 'buffer' });
        fs.writeFileSync('users.pdf', buf); 
    })
    .then(() => {
        dbConnection.close();
    })
    .catch((err) => {
        throw err;
    });
