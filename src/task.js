const fs = require('fs');
const process = require('process');

const PDFDocument = require('pdfkit');
const conv = require('binstring');
const winston = require('winston');

const Database = require('./Database');

const firstName = process.argv[2];
const tableName = 'users';
const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
        }),
    ]
});

if(!fs.existsSync(__dirname + '/pdf/')){
    fs.mkdirSync(__dirname + '/pdf/');
}

const connectionConfig = {
    host: 'localhost',
    user: 'admin',
    password: 'admin',
    database: 'myDB'
}

const dbConnection = new Database(connectionConfig);
let user = {};

dbConnection
    .query(`SELECT firstName, lastName FROM ${tableName} WHERE firstName='${firstName}'`)
    .then((rows) => {
        user.firstName = rows[0].firstName;
        user.lastName = rows[0].lastName;
    })
    .then(() => {
        createPdf();
    })
    .catch((err) => {
        dbConnection.close();
        logger.warn('Error with database data');
        logger.error(err.message);
        throw err;
    });

function createPdf(){
    let path = `${__dirname}/pdf/${user.firstName}_${user.lastName}.pdf`;

    let doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(path));
    doc.text(`First Name: ${user.firstName}`, 10, 10);
    doc.text(`Last Name: ${user.lastName}`, 10, 25);
    doc.end();

    if (fs.existsSync(path)) {
        setTimeout(() => {
            return getPdfString(path);
        }, 200);
    }
}

function getPdfString(path){

    fs.readFile(path, (err, data) => {
        if(err){
            logger.warn('Error while reading file');
            logger.error(err.message);
            throw err;
        }
        let fileS = conv(data, { in: 'buffer', out: 'binary' });
        updateUser(fileS);
    })
}

function updateUser(fileString){
    dbConnection
        .query(`UPDATE ${tableName} SET pdf=TO_BASE64(?) WHERE firstName='${firstName}'`, fileString)
        .then(() => {
            dbConnection.close();
        })
        .catch((err) => {
            logger.warn('Error while updating user PDF');
            logger.error(err.message);
            throw err;
        });
}
