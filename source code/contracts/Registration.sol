pragma solidity ^0.8.9;

import "./Registry.sol";

contract Registration {
    uint256 private nextIdentifier = 1;
    string registeredDID;   
    string public publicKey;
    address public registries;
    Registry registry;

    //Constructor which links to the main ledger
    constructor(address _registriesAddress){
        registries = _registriesAddress;
        registry = Registry(registries);
    }
    
    //Events for Logging
    event KeysSet(string publicKey);
    event DIDCreated(string did);
    event Log(string log);

    //creates new DID, DID Document, and Adds to Ledger, logging the new DID
    function registerDID() public { 
        emit Log("Attempting to Create new DID and DID Document");
        
        string memory did = string(abi.encodePacked("DID:", "ABDNSSI:", toString(nextIdentifier))); //create new DID
        nextIdentifier++; 
        DIDdocument memory document = DIDdocument(did, true, "none", msg.sender);
        
        try registry.updateRegistry(did, document) {
             emit Log("Successful");
        } catch Error(string memory error) {
            emit Log(error);
        }

        verificationMethod memory method = verificationMethod(did , "2019 Public Key", did, publicKey);
       
       try registry.setVerificationMethod(did, method) {
            emit Log("Successful");
        } catch Error(string memory error) {
            emit Log(error);
        }
        
        emit DIDCreated(did);
        
    }

    //Allows for connection with KeysGeneration Javascript for offchain Key creation
    function setKeys(string memory _publicKey) public {
        publicKey = _publicKey;
        emit KeysSet(_publicKey);
    }

    //Temporary function for converting utint to string
    function toString(uint256 value) internal pure returns (string memory) {
    
        if (value == 0) {
            return "0";
        }
    
        uint256 temp = value;
    
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }
    
        return string(buffer);
}

}