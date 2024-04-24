//Utilises the following package: https://www.npmjs.com/package/sphincs   , https://github.com/cyph/pqcrypto.js/tree/master/packages/sphincs 
// This package is an implementation of the SPHINCS+ post-quantum cryptographic signing scheme compiled to WebAssembly while also providing a java script wrapper
// Using an existing package was decided due to the complexity of self implementation, security and reliablity, and time management

const sphincs = require('sphincs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

//Generate Keys
async function keyGeneration(){
    let keyPair = await sphincs.keyPair();
    let privateKey = keyPair.privateKey;
    let publicKey = keyPair.publicKey;

    let publicKeyBuffer = Buffer.from(publicKey);
    let privateKeyBuffer = Buffer.from(privateKey);

    let publicKeyBase64 = publicKeyBuffer.toString('base64');
    let privateKeyBase64 = privateKeyBuffer.toString('base64');

    let hash = crypto.createHash('sha256').update(publicKeyBuffer).digest('hex');
    return { publicKeyBase64, privateKeyBase64, hash };
}

//Digital Signature Creation (attached = returns signature and message combined)
async function createSignature(message, privateKey){
    let buffer = Buffer.from(message);
    let signature = await sphincs.sign(buffer, privateKey);
    return signature;
}

//Digital Signature Verification (attached)
async function verifySignature(signature, publicKey){
    try{
        let isValid = await sphincs.open(signature, publicKey);
        return isValid;}
    catch{
        return false;}    
    
}


//Function for storing public keys
function storePublicKeys(publicKey, did, hash){
    let storage = {};
    const storagePath = path.join('keyStorage.json');
    if (fs.existsSync(storagePath)) {
        publicKeyStorage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    }else {
        const fileContent = fs.readFileSync(storagePath, 'utf8');
        publicKeyStorage = JSON.parse(fileContent);
    }

    publicKeyHex = publicKey.toString('hex');
    const publicKeyInfo = {
        publicKeyHex: publicKeyHex,
        hash: hash
    };

    if (!publicKeyStorage[did]) {
        publicKeyStorage[did] = [publicKeyInfo];
    } else {
        publicKeyStorage[did].push(publicKeyInfo);
    }
    fs.writeFileSync(storagePath, JSON.stringify(publicKeyStorage, null, 2), 'utf8');
}


//Function for getting public keys
function retrievePublicKeys(did) {
    const storagePath = 'keyStorage.json';
    if (!fs.existsSync(storagePath)) {
        console.error('Public key storage file does not exist.');
        return [];
    }
    const publicKeyStorage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    const publicKeyObjects = publicKeyStorage[did];
    if (!publicKeyObjects) {
        console.error(`No public keys found for DID ${did}.`);
        return [];
    }
    // Return the array of objects as is
    return publicKeyObjects;
}

module.exports = {keyGeneration, createSignature, verifySignature, storePublicKeys, retrievePublicKeys};