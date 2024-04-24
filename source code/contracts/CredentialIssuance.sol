pragma solidity ^0.8.9;

import "./Registry.sol";

struct CredentialRequest {
    string holderDID;
    bool isActive;
    string schemaId;
}

struct CredentialRecord {
        string merkleTreeRoot;
        uint256 expiryDate; 
    }


contract CredentialIssuance {
    address public registries;
    Registry registry;

    //Constructor which links to the main ledger
    constructor(address _registriesAddress){
        registries = _registriesAddress;
        registry = Registry(registries);

    }
    
    //Mapping which stores the merkle tree root of every credential
    mapping (string => CredentialRecord[]) public credentialRegistry;
    //Mapping which holds all of the schemas
    mapping (string => string) public schemaRegistry;
    //mapping for credential requests
    mapping (string => CredentialRequest[]) private credentialRequests;

    //event for logging
    event CredentialRequestRetrieved(string holderDID);

    //function for adding a schema to the schema registry
    function addSchema(string memory id, string memory schema) public {
        require(bytes(schemaRegistry[id]).length == 0, "ID Already Present");
        schemaRegistry[id] = schema;
    }
    
    //Return Schema from Schema Registry
    function getSchema(string memory id) public view returns (string memory){
        require(bytes(schemaRegistry[id]).length != 0, "Cant Find Schema");
        return schemaRegistry[id];
    }

    //Takes the HoldersDID and the merkleTreeRoot for the credential and stores both in the credential registry
    function issueCredential (string memory holderDID, string memory merkleTreeRoot, uint256 expiry) public {
        CredentialRecord memory newCredential = CredentialRecord({
            merkleTreeRoot: merkleTreeRoot,
            expiryDate: expiry
        });
        credentialRegistry[holderDID].push(newCredential);
    }

    //Function that when given a DID will return the merkle tree roots and the expiry date for all linked credentials
    function getCredentials (string memory holderDID) public view returns (CredentialRecord[] memory){
        CredentialRecord[] storage credentials = credentialRegistry[holderDID];
        return credentials;
    }

    //Function for comparing a credential merkle tree root with that stored in registry
    function checkCredential(string memory hashedCredential, string memory did) public view returns (bool){
        CredentialRecord[] memory hashes = credentialRegistry[did];
        for (uint i = 0; i < hashes.length; i++) {
            if (keccak256(abi.encodePacked(hashes[i].merkleTreeRoot)) == keccak256(abi.encodePacked(hashedCredential))) {
                return true;
            }
        }
        return false;
    }

    //function for holders to request credentials
    function requestCredential(string memory issuerDID, string memory holderDID, string memory schemaId) public {
        require(registry.isOwner(holderDID, msg.sender), "Caller is not authorized to access these verification requests");
        
        CredentialRequest memory newRequest = CredentialRequest({
        holderDID: holderDID,
        isActive: true,
        schemaId: schemaId
    });
    credentialRequests[issuerDID].push(newRequest);
    }

    //function for issuers to check and retrieve any requests for credentials
    function retrieveCredentialRequest(string memory issuerDID) public returns (CredentialRequest[] memory openRequests) {
        require(registry.isOwner(issuerDID, msg.sender), "Caller is not authorized to access these verification requests");
        CredentialRequest[] storage requests = credentialRequests[issuerDID];
        
        uint activeCount = 0;
        for (uint i = 0; i < requests.length; i++) {
            if (requests[i].isActive) {
                activeCount++;
            }
        }

        CredentialRequest[] memory openRequests = new CredentialRequest[](activeCount);

        uint counter = 0;
        for (uint i = 0; i < requests.length; i++) {
            if (requests[i].isActive) {
                openRequests[counter] = requests[i];
                counter++;
            }
        }

        return openRequests;
    }

    
}

