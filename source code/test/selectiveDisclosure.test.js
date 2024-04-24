const SHA256 = require('crypto-js/sha256');
const assert = require('assert');
const { createMerkleTree, verifyAttributeMembership } = require('../contracts/SecondaryFunctions/selectiveDisclosure');

describe('Testing of selective disclosure related ', () => {
    
    it('generates a merkle tree from credential', async ()  => {
        const fakeCredential = {
            id: "DID:ABDNSSI:1", 
            issuer: "issuerPublicKeyHash",
            validFrom: "2023-01-01",
            validTill: "1716163200",
            signature: "",
            types: ["Verifiable Credetial"], 
            credentialSubject: {
                id: "DID:ABDNSSI:1",
                name: "John",
                age: "18",
                memberOfClub: true,
                address: '123 Madeup Avenue'
            }
          };
        const {root, tree, output} = createMerkleTree(fakeCredential);
        assert(root);
    });

    it('verifies an attribute is part of a merkle tree', async ()  => {
        //create tree
        const fakeCredential = {
            id: "DID:ABDNSSI:1", 
            issuer: "issuerPublicKeyHash",
            validFrom: "2023-01-01",
            validTill: "1716163200",
            signature: "",
            types: ["Verifiable Credetial"], 
            credentialSubject: {
                id: "DID:ABDNSSI:1",
                name: "John",
                age: "18",
                memberOfClub: true,
                address: '123 Madeup Avenue'
            }
          };
        const {root, tree, output} = createMerkleTree(fakeCredential);
        
        //Get specific attribute and verify
        const attributeData = output.find(element => element[0] === "name");
        if(attributeData){
            const [_, hash, proof] = attributeData;
            const valid = verifyAttributeMembership(hash, proof, root);
            assert(valid);
        }
        else{
            assert(false);
        }

    });

    it('verifies an attribute is not part of a merkle tree', async ()  => {
        //create tree
        const fakeCredential = {
            id: "DID:ABDNSSI:1", 
            issuer: "issuerPublicKeyHash",
            validFrom: "2023-01-01",
            validTill: "1716163200",
            signature: "",
            types: ["Verifiable Credetial"], 
            credentialSubject: {
                id: "DID:ABDNSSI:1",
                name: "John",
                age: "18",
                memberOfClub: true,
                address: '123 Madeup Avenue'
            }
          };
        const {root, tree, output} = createMerkleTree(fakeCredential);
        //Get specific attribute and verify
        const attributeData = output.find(element => element[0] === "id");
        if(attributeData){
            const [_, hash, proof] = attributeData;
            const valid = verifyAttributeMembership(SHA256("test string"), proof, root);
            assert(!valid);
        }
        else{
            assert(true);
        }
    });
});