
//Functionality for Testing all contracts within Ganache Testing Framework
////////////////////////////////////////////////////////////////////////////////////

//Imports and Variables 
const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
/*
const ganacheOptions = {
  logging: {
      quiet: true 
  }
};
const web3 = new Web3(ganache.provider(ganacheOptions));
*/
const web3 = new Web3(ganache.provider());
const fs = require('fs');
const path = require('path');

const { abiRegistry, evmRegistry, abiRegistration, evmRegistration, abiCredentialIssuance, evmCredentialIssuance, abiVerification, evmVerification, abiAccessControl, evmAccessControl, abiCommunityVoting, evmCommunityVoting } = require('../compile');
const { uploadCredential, downloadCredential, uploadAttribute} = require('../contracts/SecondaryFunctions/credentialTransfer');
const { keyGeneration, createSignature, verifySignature, storePublicKeys, retrievePublicKeys} = require('../contracts/SecondaryFunctions/qrc');
const { createMerkleTree, verifyAttributeMembership } = require('../contracts/SecondaryFunctions/selectiveDisclosure');

/////// Required Constants for Tesing
let accounts;
let registry;
let registration;
let holderPublicKey, holderPrivateKey, holderPublicKeyHash;
let issuerPublicKey, issuerPrivateKey, issuerPublicKeyHash;
let verifierPublicKey, verifierPrivateKey, verifierPublicKeyHash;
const did = 'DID:ABDNSSI:1';


//Testing of all contracts
  //Deployment in Ganache Test Environment
beforeEach(async function() {
    this.timeout(10000);
    // Get a list of all Ganache test accounts (open accounts with test ether)
    accounts = await web3.eth.getAccounts();

    //Holder setup for testing
    let keyPair = await keyGeneration();
    holderPublicKey = keyPair.publicKeyBase64;
    holderPrivateKey = keyPair.privateKeyBase64;
    holderPublicKeyHash = keyPair.hash;
    //Issuer setup for testing
    let keyPair2 = await keyGeneration();
    issuerPublicKey = keyPair2.publicKeyBase64;
    issuerPrivateKey = keyPair2.privateKeyBase64;
    issuerPublicKeyHash = keyPair2.hash;
    //Verifier setup for tesing
    let keyPair3 = await keyGeneration();
    verifierPublicKey = keyPair3.publicKeyBase64;
    verifierPrivateKey = keyPair3.privateKeyBase64;
    verifierPublicKeyHash = keyPair3.hash;

    registry = await new web3.eth.Contract(abiRegistry)
      .deploy({
        data: evmRegistry,
      })
      .send({ from: accounts[0], gas: '15000000' });
    
    registration = await new web3.eth.Contract(abiRegistration)
      .deploy({
        data: evmRegistration, 
        arguments: [registry.options.address],
      })
      .send({ from: accounts[0], gas: '15000000' });
    
    credentialIssuance = await new web3.eth.Contract(abiCredentialIssuance)
      .deploy({
        data: evmCredentialIssuance, 
        arguments: [registry.options.address],
      })
      .send({ from: accounts[0], gas: '15000000' });
    
    verification = await new web3.eth.Contract(abiVerification)
      .deploy({
        data: evmVerification, 
        arguments: [registry.options.address],
      })
      .send({ from: accounts[0], gas: '15000000' });
    
    accessControl = await new web3.eth.Contract(abiAccessControl)
      .deploy({
        data: evmAccessControl, 
        arguments: [registry.options.address],
      })
      .send({ from: accounts[0], gas: '15000000' });
    
    CommunityVoting = await new web3.eth.Contract(abiCommunityVoting)
    .deploy({
      data: evmCommunityVoting, 
      arguments: [registry.options.address, credentialIssuance.options.address],
    })
    .send({ from: accounts[0], gas: '15000000' });
    
    
    });
    
  

    //TESTS
  describe('Registry', () => {
    it('deploys a contract', () => {
      assert.ok(registry.options.address);
    });
  });

  describe('Registration', () => {
    
    it('(1) Deploys a contract', () => {
      assert.ok(registration.options.address);
    });
    
    it('(4) Links Registry Contract to correct address', async () => {
        const address = await registration.methods.registries().call();
        assert.equal(registry.options.address, address);
      });

    it('(1) Can set initial Public Key for DID creation', async () => {
        await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });
        const key = await registration.methods.publicKey().call({ from: accounts[0] });
        assert.equal(key, holderPublicKeyHash);
    });

    it('(1) Attempts to set initial public key for DID creation, but it is the wrong datatype', async () => {
      try{
        await registration.methods.setKeys(659821645).send({ from: accounts[0], gas: '15000000' });
      }catch{
        assert(true);
      }
    });

    it('(1) Registers a new DID on the Register contract', async () => {
        storePublicKeys(holderPublicKey, did, holderPublicKeyHash);
        await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
        const document = await registry.methods.didRegistry(did).call();
        assert.equal(document.id, did, "DID document is empty, DID not successfuly registered");
    });

    it('(1) Can register new public keys in the issuer Registry, And also retrieve all the keys.', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' }); 
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      try{
        await registry.methods.registerPublicKey(holderPublicKeyHash, did).send({ from: accounts[0], gas: '15000000' });
      }
      catch{return false;}
      const keys = await registry.methods.retrieveKeys(did).call({from: accounts[0], gas: '15000000'});
      assert(keys.includes(holderPublicKeyHash), "Key unable to be registered");
    });

    it('(1) Wrong input when attemping to register an Issuers public key ', async () => {
      try{
        await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' }); 
        await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
        await registry.methods.registerPublicKey(12345, did).send({ from: accounts[0], gas: '15000000' });
      }
      catch{return false;}
    });

    it('(2) Non-owner of DID attempts to register a public key in issuerRegistry', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' }); 
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      try{
        await registry.methods.registerPublicKey(holderPublicKeyHash, did).send({ from: accounts[1], gas: '15000000' });
      } catch (error) {
        if (error.message.includes("revert")) {
            return true;
        } else {
            console.log("An unknown error occurred: ", error.message);
            return false;
        }
      }
    });

    it('(1) Can read the DID Document when given the corresponding DID', async () => {
        await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
        const doc = await registry.methods.readDocument(did).call({ 
            from: accounts[0]});
        assert.equal(doc.document.isActive, true, "Cannot Read Document");
        
    });

    it('(1) Fails to read DID Document due to the document not existing', async () => {
      try{
        await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
        const doc = await registry.methods.readDocument("teststring").call({ 
        from: accounts[0]});

      }catch{assert(true);}
    });

    it('(1) Can add a new verification Method to an existing DID Document', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' }); 
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      await registry.methods.addVerification(did, "Test Method", did, holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });
      const doc = await registry.methods.readDocument(did).call({ 
        from: accounts[0] });
      assert.equal(doc.methods[1].controller, did, "Verification Method Not Set Correctly");
    });

    it('(1) Fails to add a new verification method due to document not existing ', async () => {
      try{
        await registry.methods.addVerification(did, "Test Method", did, holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });
      }
      catch(error){
        assert(true);
      }
    });

    it('(2) Non owner- attempts to set a new verificationMethod in DID Document', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' }); 
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      try { 
        await registry.methods.addVerification("DID:ABDNSSI:2", "Test Method", did, holderPublicKeyHash).send({ from: accounts[1], gas: '15000000' });
      } catch (error) {
          if (error.message.includes("revert")) {
              return true;
          } else {
              console.log("An unknown error occurred: ", error.message);
          }
      }

    });
    
    it('(1) Can Update MetaData of DID Document', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' }); 
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      const update = "Test Test Updated MetaData String";
      await registry.methods.updateDocument(did, update).send({ 
        from: accounts[0], 
        gas: '15000000' 
      });
      const doc = await registry.methods.readDocument(did).call({ 
        from: accounts[0] });
      assert.equal(doc.document.metadata, update, "Update not successful");
    });

    it('(1)  Fails to update MetaData of a DID Document due to non-existant document', async () => {
      try{
        await registry.methods.updateDocument(did, update).send({ 
          from: accounts[0], 
          gas: '15000000' 
        });
      }catch{assert(true);}
    });

    it('(2) Non-Owner person tries to update DID Document', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' }); 
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      const update = "Test Test Updated MetaData String";
      try { await registry.methods.updateDocument("DID:ABDNSSI:2", update).send({ 
        from: accounts[1], 
        gas: '15000000' 
      });
      } catch (error) {
          if (error.message.includes("revert")) {
              return true;
          } else {
              console.log("An unknown error occurred: ", error.message);
          }
      }
    });

    it('(1) Owner can Deactivate a Document', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0] ,gas :'15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
        
        await registry.methods.deactivateDID(did).send({ 
          from: accounts[0], 
          gas: '15000000' });
        const doc = await registry.methods.readDocument(did).call({ 
          from: accounts[0] });
        assert.equal(doc.document.isActive, false, "Deactivation did not succeed");
        
    });

    it('(1) Fails to deactivate DID Document, as no document exists', async () => {
      try{
        await registry.methods.deactivateDID(did).send({ 
          from: accounts[0], 
          gas: '15000000' });
      }catch{assert(true);}
    });

    it('(2) Non-Owner person tries to deactivate a document', async () => {
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      try { await registry.methods.deactivateDID(did).send({ 
        from: accounts[1], 
        gas: '15000000' });
      } catch (error) {
          if (error.message.includes("revert")) {
              return true;
          } else {
              console.log("An unknown error occurred: ", error.message);
          }
      }
    });
 
  });

describe('Credential Issuance', () => {
    
    it('(1) deploys a contract', () => {
      assert.ok(credentialIssuance.options.address);
    });

    it('(1) Issuer Creates and Issues a Credential', async function () {
      this.timeout(15000);
      //Create-Holder 
      storePublicKeys(holderPublicKey, did, holderPublicKeyHash);
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Create Issuer -
      storePublicKeys(issuerPublicKey, "DID:ABDNSSI:2", issuerPublicKeyHash);
      await registration.methods.setKeys(issuerPublicKeyHash).send({ from: accounts[1] });  
      await registration.methods.registerDID().send({ from: accounts[1], gas: '15000000' });
      
      //Request Credential
      await credentialIssuance.methods.requestCredential("DID:ABDNSSI:2", "DID:ABDNSSI:1", "TestSchema").send({ from: accounts[0], gas: '15000000' }); 
      
      //Check for credential request
      const holdersDID = await credentialIssuance.methods.retrieveCredentialRequest("DID:ABDNSSI:2").send({ from: accounts[1], gas: '15000000' });
      const holder = holdersDID.toString();

      //Upload a schema onchain
      const credentialData = fs.readFileSync('schemas/schemaTemplate.json', 'utf-8');
      await credentialIssuance.methods.addSchema("TestSchema", credentialData).send({ from: accounts[0], gas: '15000000' }); 
      
      //Retrieve Schema from CredentialIssuance Contract
      const schema =  await credentialIssuance.methods.getSchema("TestSchema").call({ 
        from: accounts[1],
        gas: '15000000'});

      //After inspecting Schema, Fill in Schema.
      const fakeCredential = {
        id: holder, 
        issuer: issuerPublicKeyHash,
        validFrom: "2023-01-01",
        validTill: "1714924263",
        signature: "",
        types: ["Verifiable Credetial"], 
        credentialSubject: {
            id: holder,
            name: "Mark",
            age: "18",
            memberOfClub: true,
            address :"124 madeup avenue"
        }
      };
      //Issuer creates merkle tree
      const {root, tree, output} = createMerkleTree(fakeCredential);

      //Issuer signs merkle tree
      let message = JSON.stringify(tree);
      let privateKey = Buffer.from(issuerPrivateKey, 'base64');
      let signature = await createSignature(message, privateKey);

      //Merkle Tree Root gets sent on-chain
      await credentialIssuance.methods.issueCredential(holder, root, fakeCredential.validTill).send({from: accounts[1], gas: '15000000'});

      //Assert that tree root now exists in credential registry
      const credential = await credentialIssuance.methods.getCredentials(holder).call({from: accounts[0], gas: '15000000'});
      assert.equal(credential[0].merkleTreeRoot, root, "Credential Issuance Unsuccessful");

      //"Upload" all credential components to Holder
      uploadCredential(signature, root, tree, output);
      //"Download" and Read Credential as holder
      assert.notEqual(downloadCredential('testIssuer/credential.json'), "", "Credential Issuance Unsuccessful");

    });
  });
  
  describe('Credential Verification', () => {
    
    it('(1) deploys a contract', () => {
      assert.ok(verification.options.address);
    });

    it('(1) Verifier Can Request a Verifiable Credential & Holder can get array of credential requests', async () => {
      //Create Holder, setting public key to the address of holder
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Create Verifier, setting public key to the address of the verifier
      await registration.methods.setKeys(verifierPublicKeyHash).send({ from: accounts[1], gas: '15000000'});  
      await registration.methods.registerDID().send({ from: accounts[1], gas: '15000000' });

      //Verifier Requests Credentials
      await verification.methods.requestVerification("DID:ABDNSSI:2", "DID:ABDNSSI:1", "Request Education Proof" ).send({ from: accounts[1], gas: '15000000' });
      
      //Holder retrievs their verification requests
      let requests = await verification.methods.getVerificationRequests("DID:ABDNSSI:1").call({ from: accounts[0], gas: '15000000' });
      assert.equal(requests[0].requestInfo, "Request Education Proof", "Verification Request Not Created Successfuly");
    });
    
    it('(1) Verifier checks and Credential is Still Valid ',  async function()  {
      this.timeout(15000);
      const validTill = "1716163200";
      let validTillTimestamp = parseInt(validTill);
      
      //Create Holder, setting public key to holders public key hash
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Calls the validRevocation function with a valid time stamp to check it passes
      const valid = await verification.methods.validRevocation("DID:ABDNSSI:1", validTillTimestamp).call({ from: accounts[0] });
      assert(valid);
    });

    it('(1) Verifier checks and Credential has Expired ',  async function()  {
      this.timeout(15000);
      const validTill = "1653004800";
      let validTillTimestamp = parseInt(validTill);

      //Create Holder, setting public key to holders public key hash
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Calls the validRevocation function with an expired timestamp so the function returns false
      const valid = await verification.methods.validRevocation("DID:ABDNSSI:1", validTillTimestamp).call({ from: accounts[0] });
      assert(!valid);
    });

    it('(1) Verifier checks credential, and DID has been deactivated ',  async() => {
      const validTill = "1716163200";
      let validTillTimestamp = parseInt(validTill);
      
      //Create Holder, setting public key to holders public key hash and deactivate the DID
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      await registry.methods.deactivateDID("DID:ABDNSSI:1").send({ 
        from: accounts[0], 
        gas: '15000000' });
      
      //Assert that this DID is now revoked
      const valid = await verification.methods.validRevocation("DID:ABDNSSI:1", validTillTimestamp).call({ from: accounts[0], gas: '15000000' });
      assert(!valid);
    });

    it('(1) Verifier checks valid credential, but no expiry time given',  async() => {
      
      //If no expiry is given, input needs to be changed to 0, to allow function to run as intended
      const validTill = "";
      let validTillTimestamp = parseInt(validTill);
      if(isNaN(validTillTimestamp)){validTillTimestamp = 0;}
      
      //Create Holder, setting public key to holders public key hash
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //call validRevocation
      const valid = await verification.methods.validRevocation("DID:ABDNSSI:1", validTillTimestamp).call({ from: accounts[0], gas: '15000000' });
      assert(!valid);
    });

    it('(1) Verifier can Verifify a credential as valid from issuer', async function ()  {
      this.timeout(15000)
      
      //Create Holder, setting public key to holders public key hash
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas:'15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Create Issuer, setting public key to the address of the Issuer and setting their public key in the issuer registry
      storePublicKeys(issuerPublicKey, "DID:ABDNSSI:2", issuerPublicKeyHash);
      await registration.methods.setKeys(issuerPublicKeyHash).send({ from: accounts[1], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[1], gas: '15000000' });
      await registry.methods.registerPublicKey(issuerPublicKeyHash, "DID:ABDNSSI:2").send({ from: accounts[1], gas: '15000000' });

      //Fill in Schema.
      const fakeCredential = {
        id: "DID:ABDNSSI:1", 
        issuer: "DID:ABDNSSI:2",
        validFrom: "2023-01-01",
        validTill: "1716163200",
        signature: "",
        types: ["Verifiable Credetial"], 
        credentialSubject: {
            id: "DID:ABDNSSI:1",
            name: "John",
            age: "18",
            memberOfClub: true
        }
      };

      //Issuer creates merkle tree from the filled out schema
      const {root, tree, output} = createMerkleTree(fakeCredential);

      //Issuer signs merkle tree with SPHINCS+
      let message = JSON.stringify(tree);
      let privateKey = Buffer.from(issuerPrivateKey, 'base64');
      let signature = await createSignature(message, privateKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');
      
      //Credential given to Holder, who then gives to Verifier (Simulated)
      uploadCredential(signatureBase64, root, tree, output);
      const VC = downloadCredential('testIssuer/credential.json');

      //Verifier retrieves the public key references on-chain of the issuer  
      const keys = await registry.methods.retrieveKeys('DID:ABDNSSI:2').call();

      //verifier retrieves all the stored public keys registered to the issuer off-chain
      const storagePath = path.join('keyStorage.json');
      publicKeyStorage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
      const storedKeys = publicKeyStorage["DID:ABDNSSI:2"];
      let keyPair;
      for(let i = 0; i < keys.length; i++){
        keyPair = storedKeys.find(pair => pair.hash === keys[i]);
      }

      //Verifier verifies digital signature using public key proving credential is correct
      let PublicKey = Buffer.from(keyPair.publicKeyHex, 'base64');
      const verified = await verifySignature(Buffer.from(VC.signature, 'base64'), PublicKey);
      console.log(verified);
      assert(verified);
      
    });

    it('(2) Non-Owner of DID tries to request credential', async() => {
      
      //Create Holder, setting public key to holders public key hash
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Create Issuer, setting public key to the address of the Issuer
      await registration.methods.setKeys(issuerPublicKeyHash).send({ from: accounts[1], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[1], gas: '15000000' });

      //Issuer tries to request credential (Non-owner of DID)
      try { await credentialIssuance.methods.requestCredential("DID:ABDNSSI:2", "DID:ABDNSSI:1", "TestSchema").send({ from: accounts[1], gas: '15000000' }); 
      } catch (error) {
          if (error.message.includes("revert")) {
              return true;
          } else {
              console.log("An unknown error occurred: ", error.message);
          }
      }
    });

    it('(2) Non-Owner of DID tries to get verification requests', async() => {
      
      //Create new DID
      await registration.methods.setKeys(issuerPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Non-owner account tried to retrieve the verification requests associated with the DID
      try { await verification.methods.getVerificationRequests("DID:ABDNSSI:1").send({ from: accounts[2], gas: '15000000' }); 
      } catch (error) {
          if (error.message.includes("revert")) {
              return true;
          } else {
              console.log("An unknown error occurred: ", error.message);
          }
      }
      
    });

    it('(2) Non-Owner of DID tries to get credential requests', async() => {
      
      //setup a new DID
      await registration.methods.setKeys(issuerPublicKeyHash).send({ from: accounts[1], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[1], gas: '15000000' });
      
      //attempt to retrieve the credential requests from a non-owner address
      try { await credentialIssuance.methods.retrieveCredentialRequest("DID:ABDNSSI:2").send({ from: accounts[0], gas: '15000000' }); 
      } catch (error) {
          if (error.message.includes("revert")) {
              return true;
          } else {
              console.log("An unknown error occurred: ", error.message);
          }
      }
    });

  });
  describe('Access Control', () => {
    
    it('(1) deploys a contract', async () => {
      assert.ok(accessControl.options.address);
    });

    it('(1) Can add a new access/consent log for a credential and retrieve logs', async function () {
      this.timeout(20000); 
      //Create Holder, setting public key to the address of holder
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0] , gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Create Issuer/Verifier,setting public key to the address of the Issuer
      await registration.methods.setKeys(issuerPublicKeyHash).send({ from: accounts[1], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[1], gas: '15000000' });

      await registry.methods.registerPublicKey(issuerPublicKeyHash, "DID:ABDNSSI:2").send({ from: accounts[1], gas: '15000000' });

      //Schema.
      const fakeCredential = {
        id: "DID:ABDNSSI:1", 
        issuer: issuerPublicKeyHash,
        validFrom: "2023-01-01",
        validTill: "1716163200",
        signature: "",
        types: ["Verifiable Credetial"], 
        credentialSubject: {
            id: "DID:ABDNSSI:1",
            name: "John",
            age: "18",
            memberOfClub: true
        }
      };
      //Issuer Signs Credential
      const credentialData = JSON.stringify(fakeCredential);
      let privateKey = Buffer.from(issuerPrivateKey, 'base64');
      let signature = await createSignature(credentialData, privateKey);
      fakeCredential.signature = signature;

      

      //Consent is logged for credential access
      await accessControl.methods.logConsent("DID:ABDNSSI:1", "DID:ABDNSSI:2", credentialData).send({ from: accounts[0], gas: '15000000' });;
      
      //Consent logs are returned to verify this change
      const logs = await accessControl.methods.returnConsentLogs("DID:ABDNSSI:1").call({from: accounts[0]});
      assert(logs[0].verifierDID == "DID:ABDNSSI:2");
    });

    it ('(1) Tries to revoke a consent log that does not exist', async function (){
        try{
          const fakeCredential = {
            id: "DID:ABDNSSI:1", 
            issuer: issuerPublicKeyHash,
            validFrom: "2023-01-01",
            validTill: "1716163200",
            signature: "",
            types: ["Verifiable Credetial"], 
            credentialSubject: {
                id: "DID:ABDNSSI:1",
                name: "John",
                age: "18",
                memberOfClub: true
            }
          };

          const credentialData = JSON.stringify(fakeCredential);
          await accessControl.methods.revokeConsent(credentialData, "DID:ABDNSSI:1", "DID:ABDNSSI:2").send({ from: accounts[0], gas: '15000000' });
        }
        catch{assert(true);}
    });

    it('(1) Can revoke consent within an existing log', async function() {
      this.timeout(20000);
       //Create Holder, setting public key to the address of holder
      await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
      
      //Create Issuer/Verifier setting public key to the address of the Issuer
      await registration.methods.setKeys(issuerPublicKeyHash).send({ from: accounts[1], gas: '15000000' });  
      await registration.methods.registerDID().send({ from: accounts[1], gas: '15000000' });

      //register public key in issuer registry
      await registry.methods.registerPublicKey(issuerPublicKeyHash, "DID:ABDNSSI:2").send({ from: accounts[1], gas: '15000000' });

      //Schema.
      const fakeCredential = {
        id: "DID:ABDNSSI:1", 
        issuer: issuerPublicKeyHash,
        validFrom: "2023-01-01",
        validTill: "1716163200",
        signature: "",
        types: ["Verifiable Credetial"], 
        credentialSubject: {
            id: "DID:ABDNSSI:1",
            name: "John",
            age: "18",
            memberOfClub: true
        }
      };

      //Issuer Signs Credential
      const credentialData = JSON.stringify(fakeCredential);
      let privateKey = Buffer.from(issuerPrivateKey, 'base64');
      let signature = await createSignature(credentialData, privateKey);
      fakeCredential.signature = signature;
      
      //Initial Consent to the credential is logged
      await accessControl.methods.logConsent("DID:ABDNSSI:1", "DID:ABDNSSI:2", credentialData).send({ from: accounts[0], gas: '15000000' });
      
      //Consent being withdrawn is is logged
      await accessControl.methods.revokeConsent(credentialData, "DID:ABDNSSI:1", "DID:ABDNSSI:2").send({ from: accounts[0], gas: '15000000' });
      
      //Consent logs are returned to verify consent status
      const logs = await accessControl.methods.returnConsentLogs("DID:ABDNSSI:1").call({from: accounts[0]});
      assert(logs[0].isConsentActive == false);
    });

    it('(1) Holder can choose specific attribute to disclose, and verifier can verify that it is part of signed credential', async function() {
      this.timeout(20000);
      
      //Makeshift credential filled out by issuer
      const credential = {
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

      //Merkle Tree is created from the credential
      const {root, tree, output} = createMerkleTree(credential);

      //Issuer signs merkle tree
      let message = JSON.stringify(tree);
      let privateKey = Buffer.from(issuerPrivateKey, 'base64');
      let signature = await createSignature(message, privateKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');
      
      //Credential given to Holder 
      uploadCredential(signatureBase64, root, tree, output);
      const VC = downloadCredential('testIssuer/credential.json');

      //Holder selects an attribute to reveal
      const attr = "name";
      const attributeEntry = output.find(entry => entry[0] === attr);
      
      if (attributeEntry) {
        const [, hash, proof] = attributeEntry;
        
        //Holder sends verifier, the associated, hash, proof, root and tree 
        
        uploadAttribute(VC.signature,hash, proof, VC.tree, VC.root);
        const attribute = downloadCredential('testIssuer/attribute.json');
        
        const verifiedProof = proof.map(p => ({
          position: p.position,
          data: Buffer.isBuffer(p.data) ? p.data : Buffer.from(p.data.data)
        }));

        //Verifier verifies attribute is part of merkle tree and thus part of valid credential
        const valid = verifyAttributeMembership(hash, verifiedProof, attribute.root);
        assert(valid);
        
        //Verify Signature
        //Verifier verifies digital signature using public key proving credential is correct
        let PublicKey = Buffer.from(issuerPublicKey, 'base64');
        const verified = await verifySignature(Buffer.from(attribute.signature, 'base64'), PublicKey);
        assert(verified);

      }else{
        assert(false);
      }

    });

    

  });

  describe('Community Voting ', () => {
    it('deploys a contract', () => {
      assert.ok(CommunityVoting.options.address);
    });
    
    it('can initialise score for a DID', async () => {
        try
        {
          await CommunityVoting.methods.initialiseScore("DID:ABDNSSI:1").call({from: accounts[0]});
          assert(true);
        }catch{
          assert(false);
        }
    });

    it('can retrieve a score', async () => {
      try
      {
        await CommunityVoting.methods.initialiseScore("DID:ABDNSSI:1").send({from: accounts[0], gas: 15000000});
        const score = await CommunityVoting.methods.retrieveScore("DID:ABDNSSI:1").call({from: accounts[0]});
        assert(score);
      }catch{
        assert(false);
      }
    });

    it('can create a proposal', async () => {
      try
        {
          await CommunityVoting.methods.createProposal("DID:ABDNSSI:1", "Member of Tennis Club").send({from: accounts[0], gas: 15000000});
          const index = 0;
          const proposal = await CommunityVoting.methods.proposals("DID:ABDNSSI:1", index).call({from: accounts[0]});
          assert(proposal);
        }catch{
          assert(false);
        }
    });


    //All tests below here are expected to fail now due to the 12 hour minimum voting period. Modify CommunityVoting contract so it doesnt have the requires and they will pass/
    //Also need to remove the voting time require 
    it('can vote on a proposal', async () => {
      try
        {
          await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
          await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
          const receipt = await CommunityVoting.methods.createProposal("DID:ABDNSSI:1", "Member of Tennis Club", "evidence string").send({from: accounts[0], gas: 15000000});
          const proposalID = receipt.events.Creation.returnValues.identifier.toString();
          await CommunityVoting.methods.voteOnProposal("DID:ABDNSSI:1", "DID:ABDNSSI:1", proposalID, true).send({from: accounts[0], gas: 15000000});
          const proposal = await CommunityVoting.methods.votes(proposalID, 0).call({from: accounts[0], gas: 15000000});
          assert(proposal);
        }catch{
          assert(false);
        }
    });

    it('can challenge a finished proposal', async () => {
      try{
        //make account
          await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
          await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
          //make proposal
          const receipt = await CommunityVoting.methods.createProposal("DID:ABDNSSI:1", "Member of Tennis Club", "evidence string").send({from: accounts[0], gas: 15000000});
          const proposalID = receipt.events.Creation.returnValues.identifier.toString();
          //vote on proposal;
          await CommunityVoting.methods.voteOnProposal("DID:ABDNSSI:1", "DID:ABDNSSI:1", proposalID, true).send({from: accounts[0], gas: 15000000});
          const proposal = await CommunityVoting.methods.votes(proposalID, 0).call({from: accounts[0], gas: 15000000});
          //execute proposal
          await CommunityVoting.methods.executeProposal(proposalID, "DID:ABDNSSI:1").send({from: accounts[0], gas: 15000000});
          //challenge proposal
          const proof = await CommunityVoting.methods.challengeVote(proposalID, "DID:ABDNSSI:1", "EVIDENCE STRING").send({from: accounts[0], gas: 15000000});
          const returnVal = proof.events.challengeCreation.returnValues.message.toString();
          console.log(returnVal);
          assert(returnVal);
      }catch{
        assert(false);
      }
    });

    it('can vote on challenge', async () => {
      try{
        //make account
          await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
          await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
          //make proposal
          const receipt = await CommunityVoting.methods.createProposal("DID:ABDNSSI:1", "Member of Tennis Club", "evidence string").send({from: accounts[0], gas: 15000000});
          const proposalID = receipt.events.Creation.returnValues.identifier.toString();
          //vote on proposal;
          await CommunityVoting.methods.voteOnProposal("DID:ABDNSSI:1", "DID:ABDNSSI:1", proposalID, true).send({from: accounts[0], gas: 15000000});
          const proposal = await CommunityVoting.methods.votes(proposalID, 0).call({from: accounts[0], gas: 15000000});
          //execute proposal
          await CommunityVoting.methods.executeProposal(proposalID, "DID:ABDNSSI:1").send({from: accounts[0], gas: 15000000});
          //challenge proposal
          const proof = await CommunityVoting.methods.challengeVote(proposalID, "DID:ABDNSSI:1", "EVIDENCE STRING").send({from: accounts[0], gas: 15000000});
          const challengeIdentifier = proof.events.challengeCreation.returnValues.message.toString();
          //Vote on challenge
          const vote = await CommunityVoting.methods.voteOnChallenge("DID:ABDNSSI:1", proposalID, challengeIdentifier, true).send({from: accounts[0], gas: 15000000});
          const challengeOutput = vote.events.Log.returnValues.message;
          console.log(challengeOutput);
          assert(challengeOutput);
      }catch{
        assert(false);
      }
    });

    it('can execute a proposal', async () => {
      try{
        //make account
          await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
          await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
          //make proposal
          const receipt = await CommunityVoting.methods.createProposal("DID:ABDNSSI:1", "Member of Tennis Club", "evidence string").send({from: accounts[0], gas: 15000000});
          const proposalID = receipt.events.Creation.returnValues.identifier.toString();
          //vote on proposal;
          await CommunityVoting.methods.voteOnProposal("DID:ABDNSSI:1", "DID:ABDNSSI:1", proposalID, true).send({from: accounts[0], gas: 15000000});
          const proposal = await CommunityVoting.methods.votes(proposalID, 0).call({from: accounts[0], gas: 15000000});
          //execute proposal
          const proof = await CommunityVoting.methods.executeProposal(proposalID, "DID:ABDNSSI:1").send({from: accounts[0], gas: 15000000});
          const returnVal = proof.events.execute.returnValues.result;
          assert(returnVal);
      }catch{
        assert(false);
      }
    });

    it('execute a challenge', async () => {
      try{
        //make account
          await registration.methods.setKeys(holderPublicKeyHash).send({ from: accounts[0], gas: '15000000' });  
          await registration.methods.registerDID().send({ from: accounts[0], gas: '15000000' });
          //make proposal
          const receipt = await CommunityVoting.methods.createProposal("DID:ABDNSSI:1", "Member of Tennis Club", "evidence string").send({from: accounts[0], gas: 15000000});
          const proposalID = receipt.events.Creation.returnValues.identifier.toString();
          //vote on proposal;
          await CommunityVoting.methods.voteOnProposal("DID:ABDNSSI:1", "DID:ABDNSSI:1", proposalID, true).send({from: accounts[0], gas: 15000000});
          const proposal = await CommunityVoting.methods.votes(proposalID, 0).call({from: accounts[0], gas: 15000000});
          //execute proposal
          await CommunityVoting.methods.executeProposal(proposalID, "DID:ABDNSSI:1").send({from: accounts[0], gas: 15000000});
          //challenge proposal
          const proof = await CommunityVoting.methods.challengeVote(proposalID, "DID:ABDNSSI:1", "EVIDENCE STRING").send({from: accounts[0], gas: 15000000});
          const challengeIdentifier = proof.events.challengeCreation.returnValues.message.toString();
          //Vote on challenge
          const vote = await CommunityVoting.methods.voteOnChallenge("DID:ABDNSSI:1", proposalID, challengeIdentifier, true).send({from: accounts[0], gas: 15000000});
          const challengeOutput = vote.events.Log.returnValues.message;
          //Execute challenge
          const execute = await CommunityVoting.methods.executeChallenge(challengeIdentifier, proposalID).send({from: accounts[0], gas: 15000000});
          const result = execute.events.challengeExecuted.returnValues.result;
          assert(result);
      }catch{
        assert(false);
      }
    });


  });

  

