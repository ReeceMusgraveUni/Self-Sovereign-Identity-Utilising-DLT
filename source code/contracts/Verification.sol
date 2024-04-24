pragma solidity ^0.8.9;

import "./Registry.sol";

struct VerificationRequest {
    string holderDID;
    string verifierDID;
    bool isActive;
    string requestInfo;
}


contract Verification {
    address public registries;
    Registry registry;

    //mapping for verification requests
    mapping (string => VerificationRequest[]) private verificationRequests;

    event Log (string message);
    
    constructor(address _registriesAddress){
        registries = _registriesAddress;
        registry = Registry(registries);

    }


    //function for holders to view the requests made by verifiers to them for information
    function getVerificationRequests(string memory did) public view returns (VerificationRequest[] memory requests) {
        require(registry.isOwner(did, msg.sender), "Caller is not authorized to access these verification requests");
        VerificationRequest[] storage requests = verificationRequests[did];
        return requests;
    }


    //Function allows Verifiers to Request Credentials of Holders
    function requestVerification (string memory verifierDID, string memory holderDID, string memory requestInfo) public {
        require(registry.isOwner(verifierDID, msg.sender), "Caller is not authorized to access these verification requests");
        VerificationRequest memory newRequest = VerificationRequest({
            holderDID: holderDID,
            verifierDID: verifierDID,
            isActive: true,
            requestInfo: requestInfo
        });
        verificationRequests[holderDID].push(newRequest);
        emit Log("Verification Requested");
    }

    //Checks if DID or Credential is invalid, validTill requires off-chain conversion to uInt
    function validRevocation (string memory holderDID, uint256 validTill) public view returns(bool) {
        (string memory id, bool isActive, string memory metadata, address owner) = registry.didRegistry(holderDID);
        if (!isActive) {
         return false; 
        }
        if (validTill == 0 || block.timestamp >= validTill) {
            return false; // validTill is empty or Credential is expired
        }
        return true;
    }

}