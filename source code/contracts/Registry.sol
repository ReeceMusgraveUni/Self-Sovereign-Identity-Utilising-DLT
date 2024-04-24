pragma solidity ^0.8.9;

struct DIDdocument {
        string id;
        bool isActive;
        string metadata;
        address owner;
    }

struct verificationMethod {
    string id;
    string type;
    string controller;
    string publicKey;
}

struct DIDdata {
    DIDdocument document;
    verificationMethod[] methods;
}

contract Registry {
    
    //Event for Logging
    event Log (string message);
    
    //Mappings act as ledgers
    mapping (string => DIDdocument) public didRegistry;
    //Mapping from issuersDID to their public keys
    mapping (string => string[]) public issuerRegistry;
    //Ledger for verificationMethods
    mapping (string => verificationMethod[]) public didVerificationMethods;


    //Function for updating the registry. Called from Registration Contract. Inserts DID and Document into ledger
    function updateRegistry (string memory did, DIDdocument memory document) public { 
        didRegistry[did] = document; 
    }

    //Function which returns all the public keys associated with an issuer
    function retrieveKeys (string memory did) public view  returns(string[] memory) { 
        return issuerRegistry[did]; 
    }

    //Function that allows anyone to read an associated Document given its corresponding DID
    function readDocument(string memory did) external view returns (DIDdata memory){ 
        require(bytes(didRegistry[did].id).length != 0, "DID not found");
        return DIDdata({
            document: didRegistry[did],
            methods: didVerificationMethods[did]
        });
    }

    //Method for setting a new verification method for a DID
    function setVerificationMethod(string memory did, verificationMethod memory method) public {
        require(bytes(didRegistry[did].id).length != 0, "DID not found");
        didVerificationMethods[did].push(method);
        emit Log("New Verification Method Set");
    }

    //Method for creating the verification method
    function addVerification(string memory id, string memory _type, string memory controller, string memory publicKey) public {
        DIDdocument storage document = didRegistry[id];
        require(msg.sender == document.owner, "Caller is not the owner of the DID document");
        verificationMethod memory method = verificationMethod(id, _type, controller, publicKey);
        setVerificationMethod(id, method);
    }
    

    //update contents of a DID Document, requires authorisation of method caller
    function updateDocument(string memory did, string memory update) external { 
        DIDdocument storage document = didRegistry[did];
        require(msg.sender == document.owner, "Caller is not the owner of the DID document");
        document.metadata = update;
        emit Log("DID Document Updated");
    }

    //function to retrieve did owner from other functions
    function isOwner(string memory did, address sender) public view returns (bool) {
        DIDdocument storage document = didRegistry[did];
        return sender == document.owner;
    }

    //Given authorisation, deactivate the DID Document
    function deactivateDID(string memory did) external { 
        DIDdocument storage document = didRegistry[did];
        require(msg.sender == document.owner, "Caller is not the owner of the DID document");
        document.isActive = false;
        emit Log("DID Document Deactivated");
    }

    //registers the public key with the issuerRegistry to be used in the verification process
    function registerPublicKey (string memory key, string memory did) public {
        DIDdocument storage document = didRegistry[did];
        require(msg.sender == document.owner, "Caller is not the owner of the DID document");
        issuerRegistry[did].push(key);
        emit Log("New key added to Issuer ledger");
    }

    
}

