'use strict';

const {createHash} = require('crypto');
const {exec} = require('child_process');

function getUuidFromWmic() {
    return new Promise((resolve) => {
        exec('wmic csproduct get name,identifyingnumber,uuid', (err, stdout, stderr) => {
            if (err) {
                resolve('');
            } else {
                if (typeof stdout !== 'string') {
                    stdout = stdout.toString();
                }
                let re = /\b\w+-\w+-\w+-\w+-\w+\b/gm;
                let match = re.exec(stdout) || [''];
                resolve(match[0]);
            }
        });
    });
}

function getUuidFromReg() {
    return new Promise((resolve) => {
        const wow64 = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432') ? ' /reg:64' : '';
        exec('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid' + wow64, (err, stdout, stderr) => {
            if (err) {
                resolve('');
            } else {
                if (typeof stdout !== 'string') {
                    stdout = stdout.toString();
                }
                let re = /\b\w+-\w+-\w+-\w+-\w+\b/gm;
                let match = re.exec(stdout) || [''];
                resolve(match[0]);
            }
        });
    });
}

const futureWmic = getUuidFromWmic();
const futureReg = getUuidFromReg();

function getDeviceId() {
    return new Promise((resolve) => {
        let hash = createHash('sha256');
        Promise.all([futureWmic, futureReg]).then((results) => {
            hash.update(results[0]);
            hash.update(results[1]);
            resolve(hash.digest('hex'));
        });
    });
}

module.exports = getDeviceId;