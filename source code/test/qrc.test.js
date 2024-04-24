const sphincs = require('sphincs');
const assert = require('assert');
const { keyGeneration, createSignature, verifySignature} = require('../contracts/SecondaryFunctions/qrc');

describe('Testing of SPHINCS+ related functions', () => {
    
    it('generats a new key pair', async ()  => {
        let {publicKeyBase64, privateKeyBase64, publicKeyHex} = await keyGeneration();
        assert.ok(publicKeyBase64, 'Public key is not defined');
        assert.ok(privateKeyBase64, 'Private key is not defined');
    });

    it('creates a new signature', async function() {
        this.timeout(15000);
        let {publicKeyBase64, privateKeyBase64, publicKeyHex} = await keyGeneration();
        let message = 'Test Message for Signature';
        let privateKey = Buffer.from(privateKeyBase64, 'base64');
        let signature = await createSignature(message, privateKey);
        assert.ok(signature, 'Signature was not generated');
    });

    it('can verify a signature when given correct key', async function() {
        this.timeout(15000);
        let {publicKeyBase64, privateKeyBase64, publicKeyHex} = await keyGeneration();
        let message = 'Test Message for Signature';
        let privateKey = Buffer.from(privateKeyBase64, 'base64');
        let publicKey = Buffer.from(publicKeyBase64, 'base64');
        let signature = await createSignature(message, privateKey);
        let valid = await verifySignature(signature, publicKey);
        console.log(valid);
        assert(valid);
    });

    it('fails to verify a signature when given a wrong key',async function()  {
        this.timeout(15000);
        let {publicKeyBase64, privateKeyBase64, publicKeyHex} = await keyGeneration();
        let privateKey = Buffer.from(privateKeyBase64, 'base64');
        let wrongKeyPair = await keyGeneration();
        let wrongPublicKey = Buffer.from(wrongKeyPair.publicKeyBase64, 'base64');

        let message = 'Test Message for Signature';
        let signature = await createSignature(message, privateKey);
        let valid = await verifySignature(signature, wrongPublicKey);
        assert(!valid);
    });
  });