const fs = require('fs');

//These functions are defunct in use with the UI, and are only used for mocha tests

//Functions to simulate the off chain transfer and storage of credentials
function uploadCredential(signature, root, tree, output) {
    const dataToSave = {
        signature: signature,
        root: root,
        output: output,
        tree: tree
    };
    const dataString = JSON.stringify(dataToSave, null, 2);
    fs.writeFileSync('testIssuer/credential.json', dataString, 'utf-8');
    console.log('Credential saved to file.');
}

//function to simulate the off chain transfer of credential attributes, holder --> verifier
function uploadAttribute(signature, hash, proof, tree, root){
    const dataToSave = {
        signature: signature,
        hash: hash,
        proof: proof,
        tree: tree,
        root: root
    }
    const dataString = JSON.stringify(dataToSave, null, 2);
    fs.writeFileSync('testIssuer/attribute.json', dataString, 'utf-8');
}

//input is file to be read, could be credential or attribute
function downloadCredential(file) {
    const credentialData = fs.readFileSync(file, 'utf-8');
    const credential = JSON.parse(credentialData);
    console.log('Credential loaded from file.');
    return credential;
}

module.exports = {uploadCredential, downloadCredential, uploadAttribute};