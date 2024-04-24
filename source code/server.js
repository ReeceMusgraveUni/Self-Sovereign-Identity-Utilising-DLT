const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const app = express();
const port = 3001; 


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


const { keyGeneration, createSignature, verifySignature, storePublicKeys, retrievePublicKeys} = require('./contracts/SecondaryFunctions/qrc');
const { createMerkleTree, verifyAttributeMembership } = require('./contracts/SecondaryFunctions/selectiveDisclosure');


app.use(express.json());

app.post('/api/generateKeys', async (req, res) => {
    try {
        const keyPair = await keyGeneration();
        res.json(keyPair);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/api/verifySignature', async (req, res) => {
    try {
        const { signature, publicKey } = req.body;
        const key = Buffer.from(publicKey, 'base64');
        let signatureBuf = Buffer.from(signature, 'base64');
        const valid = await verifySignature(signatureBuf, key);
        res.json(valid);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/api/verifyAttributeMembership', async (req, res) => {
    try {
        
        const { hash, proof, root } = req.body;
        let hashBuffer;
        if (hash.type === 'Buffer') {
            hashBuffer = Buffer.from(hash.data);
        }
        let proofBuffers = proof.map(proof => {
            return {
                position: proof.position,
                data: Buffer.from(proof.data.data)
            };
        });
        const valid = verifyAttributeMembership(hashBuffer, proofBuffers, root);
        res.json(valid);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/api/createMerkleTree', async (req, res) => {
    try {
        const data = req.body;
        const keyPair = await createMerkleTree(data);
        res.json(keyPair);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/api/retrieveKey', async (req, res) => {
    try {
        const { did } = req.body;
        const publicKeyObjects = retrievePublicKeys(did);
        if (publicKeyObjects.length === 0) {
            return res.status(404).send(`No public keys found for DID ${did}.`);
        }
        res.json(publicKeyObjects);
    } catch (error) {
        res.status(500).send(`Server error: ${error.toString()}`);
    }
});

app.post('/api/createSignature', async (req, res) => {
    try {
        const { privateKey, message} = req.body;
        let privateKeyBuffer = Buffer.from(privateKey, 'base64');
        const keyPair = await createSignature(message, privateKeyBuffer);
        const signatureBase64 = Buffer.from(keyPair).toString('base64');
        res.json(signatureBase64);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/api/storePublicKey', async (req, res) => {
    const { publicKey, did, hash } = req.body;
    if (!publicKey || !did || !hash) {
        return res.status(400).send('Missing required fields');
    }
    try {
        await storePublicKeys(publicKey, did, hash);
        res.status(200).send('Public key stored successfully');
    } catch (error) {
        console.error('Failed to store public key:', error);
        res.status(500).send(error.toString());
    }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
