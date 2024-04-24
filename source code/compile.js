
//Compile Script for the Smart Contracts

const path = require('path');
const fs = require('fs');
const solc = require('solc');

const registryPath = path.resolve(__dirname, 'contracts', 'Registry.sol');
const registrySource = fs.readFileSync(registryPath, 'utf8');

const registrationPath = path.resolve(__dirname, 'contracts', 'Registration.sol');
const registrationSource = fs.readFileSync(registrationPath, 'utf8');

const credentialIssuancePath = path.resolve(__dirname, 'contracts', 'CredentialIssuance.sol');
const credentialIssuanceSource = fs.readFileSync(credentialIssuancePath, 'utf8');

const verificationPath = path.resolve(__dirname, 'contracts', 'Verification.sol');
const verificationSource = fs.readFileSync(verificationPath, 'utf8');

const AccessControlPath = path.resolve(__dirname, 'contracts', 'AccessControl.sol');
const AccessControlSource = fs.readFileSync(AccessControlPath, 'utf8');

const CommunityVotingPath = path.resolve(__dirname, 'contracts', 'CommunityVoting.sol');
const CommunityVotingSource = fs.readFileSync(CommunityVotingPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'Registry.sol': {
            content: registrySource,
        },
        'Registration.sol': {
            content: registrationSource,
        },
        'CredentialIssuance.sol': {
            content: credentialIssuanceSource,
        },
        'Verification.sol': {
            content: verificationSource,
        },
        'AccessControl.sol': {
            content: AccessControlSource,
        },
        'CommunityVoting.sol': {
            content: CommunityVotingSource,
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
};


const output = JSON.parse(solc.compile(JSON.stringify(input))).contracts;

const abiRegistry = output['Registry.sol'].Registry.abi;
const evmRegistry = output['Registry.sol'].Registry.evm.bytecode.object;

const abiRegistration = output['Registration.sol'].Registration.abi;
const evmRegistration = output['Registration.sol'].Registration.evm.bytecode.object;

const abiCredentialIssuance = output['CredentialIssuance.sol'].CredentialIssuance.abi;
const evmCredentialIssuance = output['CredentialIssuance.sol'].CredentialIssuance.evm.bytecode.object;

const abiVerification = output['Verification.sol'].Verification.abi;
const evmVerification = output['Verification.sol'].Verification.evm.bytecode.object;

const abiAccessControl = output['AccessControl.sol'].AccessControl.abi;
const evmAccessControl = output['AccessControl.sol'].AccessControl.evm.bytecode.object;

const abiCommunityVoting = output['CommunityVoting.sol'].CommunityVoting.abi;
const evmCommunityVoting = output['CommunityVoting.sol'].CommunityVoting.evm.bytecode.object;


//write to JSON file
artifact = {
    abi: abiRegistry,
    bytecode: evmRegistry
};
fs.writeFileSync("deployedArtifacts/registryContract.json", JSON.stringify(artifact, null, 2), 'utf8');
artifact = {
    abi: abiRegistration,
    bytecode: evmRegistration
};
fs.writeFileSync("deployedArtifacts/registrationContract.json", JSON.stringify(artifact, null, 2), 'utf8');
artifact = {
    abi: abiCredentialIssuance,
    bytecode: evmCredentialIssuance
};
fs.writeFileSync("deployedArtifacts/credentialIssuance.json", JSON.stringify(artifact, null, 2), 'utf8');
artifact = {
    abi: abiVerification,
    bytecode: evmVerification
};
fs.writeFileSync("deployedArtifacts/verification.json", JSON.stringify(artifact, null, 2), 'utf8');
artifact = {
    abi: abiAccessControl,
    bytecode: evmAccessControl
};
fs.writeFileSync("deployedArtifacts/accessControl.json", JSON.stringify(artifact, null, 2), 'utf8');
artifact = {
    abi: abiCommunityVoting,
    bytecode: evmCommunityVoting
};
fs.writeFileSync("deployedArtifacts/CommunityVoting.json", JSON.stringify(artifact, null, 2), 'utf8');


module.exports = {
    abiRegistry,
    evmRegistry,
    abiRegistration,
    evmRegistration,
    abiCredentialIssuance,
    evmCredentialIssuance,
    abiVerification,
    evmVerification,
    abiAccessControl,
    evmAccessControl,
    abiCommunityVoting,
    evmCommunityVoting
};