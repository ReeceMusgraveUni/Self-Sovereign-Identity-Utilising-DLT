pragma solidity ^0.8.9;

import "./Registry.sol";

contract AccessControl {

    address public registries;
    Registry registry;

    //Constructor which links to the main ledger
    constructor(address _registriesAddress){
        registries = _registriesAddress;
        registry = Registry(registries);

    }

    struct ConsentLog {
        string credentialHash;
        string verifierDID;
        bool isConsentActive;
        uint256 timestamp;
    }

    event Log(string log);
    //Ledger which each holder, showing the log of consents for their credentials
    mapping(string => ConsentLog[]) private consentLogs;

    //when a credential is given to a verifier, the consent is logged here allowing users to revoke it later on.
    function logConsent (string memory holderDID, string memory verifierDID, string memory credentialHash) public {
        require(registry.isOwner(holderDID, msg.sender), "Caller is not authorized to access these verification requests");
        ConsentLog memory log = ConsentLog({
        credentialHash: credentialHash,
        verifierDID: verifierDID,
        isConsentActive: true,
        timestamp: block.timestamp
        });
        consentLogs[holderDID].push(log);
        emit Log('Successfully added consent log');
    }

    //Log the revocation of consent of a verifier for a specific credential
    function revokeConsent(string memory credentialHash, string memory holderDID, string memory verifierDID) public {
        require(registry.isOwner(holderDID, msg.sender), "Caller is not authorized to access these verification requests");
        ConsentLog[] storage logArray = consentLogs[holderDID];
        for (uint i = 0; i < logArray.length; i++) {
        if (keccak256(abi.encodePacked(logArray[i].credentialHash)) == keccak256(abi.encodePacked(credentialHash)) &&
            keccak256(abi.encodePacked(logArray[i].verifierDID)) == keccak256(abi.encodePacked(verifierDID))) {
            logArray[i].isConsentActive = false;
            logArray[i].timestamp = block.timestamp;
            emit Log('Successfully revoked consent log');
            return;
        }
    }
        revert("Access/Consent Log not found");

    }

    //function that returns the consent (access) logs for a given credential
    function returnConsentLogs(string memory holderDID) public view returns (ConsentLog[] memory){
        require(registry.isOwner(holderDID, msg.sender), "Caller is not authorized to access these verification requests");
        ConsentLog[] memory log = consentLogs[holderDID];
        return log;
    }
    



}