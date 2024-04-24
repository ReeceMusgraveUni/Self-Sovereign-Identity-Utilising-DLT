const { MerkleTree } = require('merkletreejs');
const SHA256 = require('crypto-js/sha256');
const CryptoJS = require('crypto-js');


//function that takes a filled in credential and converts to a merkle tree, returning update JSON file and the Merkle Tree Root
function createMerkleTree(credential) {
    
    //Turn Credential into leaves accounting for nested items
    let leaves = [];
    let leavesData = [];
    function processAndHashEntries(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                processAndHashEntries(value, `${prefix}${key}.`);
            } else {
                const leafData = `${prefix}${key}:${JSON.stringify(value)}`;
                const leafHash = SHA256(leafData).toString(CryptoJS.enc.Hex);
                leaves.push(leafHash);
                leavesData.push(key);
            }
        }
    }

    processAndHashEntries(credential);

    // generate tree
    const hashedLeaves = leaves.map(hash => Buffer.from(hash, 'hex')); 
    const tree = new MerkleTree(hashedLeaves, SHA256, { sortPairs: true });
    const root = tree.getRoot().toString('hex');

    //generate proofs and insert in to final output form
    let output = []
    for (let i = 0; i < hashedLeaves.length; i++){
        output.push([leavesData[i], hashedLeaves[i] , tree.getProof(hashedLeaves[i])]);
    }
    
    return {root, tree, output};
}


//Function that takes in an attribute hash, proof and the merkle tree root, and verifies inclusion
function verifyAttributeMembership(hash, proof, root){
    const treeForVerification = new MerkleTree([], SHA256, { sortPairs: true });
    const valid = treeForVerification.verify(proof, hash, root);
    return valid;
}



module.exports = {createMerkleTree, verifyAttributeMembership};