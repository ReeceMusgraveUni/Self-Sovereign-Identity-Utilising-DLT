pragma solidity ^0.8.9;

import "./Registry.sol";

struct Vote {
    string voter;
    uint256 trustScore;
    bool vote;
}

struct ChallengeVote {
    string voter;
    uint256 trustScore;
    bool vote; 
}

struct Proposal {
    address owner;
    uint256 id;
    string did;
    string claim;
    string evidence;
    uint256 voteStart;
    uint256 voteEnd;
    bool executed;
    bool validated;
}

struct Challenge {
    address challenger;
    uint256 challengeID;
    string newEvidence;
    uint256 voteEnd;
    bool resolved;
    
}

struct Voter {
   string voterDID;
   uint256 timeOfLastVote;
   uint256 trustScore;
   uint256 creationTime; 
}

contract CommunityVoting {


    //Mapping from DID to Proposals
    mapping(string => Proposal[]) public proposals;

    //Mapping from Proposal id to Challenges
    mapping(uint256 => Challenge[]) public challenges;

    //Mapping from Proposal id to Votes
    mapping(uint256 => Vote[]) public votes;

    //Mapping from challengeID to Votes
    mapping(uint256 => ChallengeVote[]) public challengeVotes;

    //Contract Owner
    address private contractOwner;
    //Array Trust Score
    Voter[] trustScores;

    //Mapping of initiated accounts
    mapping(string => bool) public initiatedAccounts;

    //Proposal Identifiers
    uint256 identifier = 1;
    uint256 challengeIdentifier = 1;
    //Import Contracts
    address public registries;
    Registry registry;
    address public addressCredentialIssuance;

    constructor(address _registriesAddress, address _credentialAddress){
        registries = _registriesAddress;
        registry = Registry(registries);
        addressCredentialIssuance = _credentialAddress;
    }

    event Log (string message);
    event Creation (uint256 identifier);
    event challengeCreation (uint256 message);
    event execute(bool result);
    event challengeExecuted(bool result);

    //Funtion Takes in a DID and sets initial trust value to a base of 60
    function initialiseScore (string memory did) public {
        require(!initiatedAccounts[did], "DID has already been initiated");
        require(registry.isOwner(did, msg.sender), "Caller is not authorized to vote as this user");
        initiatedAccounts[did] = true;
        Voter memory voter = Voter(did, block.timestamp, 40, block.timestamp);
        trustScores.push(voter);
    }

    function getProposal(string memory did, uint256 id) public view returns (Proposal memory){
        Proposal[] memory allProposals = proposals[did];
        for(uint i = 0; i < allProposals.length; i++) {
            if(allProposals[i].id == id) {
                return allProposals[i];
            }
        }
        revert("Proposal not found.");
    }

    function getChallenge(uint256 proposalId, uint256 challengeId) public view returns (Challenge memory){
        Challenge[] memory allChallenges = challenges[proposalId];
        for(uint i = 0; i < allChallenges.length; i++) {
            if(allChallenges[i].challengeID == challengeId) {
                return allChallenges[i];
            }
        }
        revert("Challenege not found.");
    }

    //function that takes the increase amount and the DID and increases the score
    function increaseScore (string memory did, uint256 amount) internal {
        for (uint256 i = 0; i < trustScores.length; i++) {
        if (keccak256(bytes(trustScores[i].voterDID)) == keccak256(bytes(did))) {
            if(trustScores[i].trustScore + amount > 100) {
                trustScores[i].trustScore = 100;
            } else {
                trustScores[i].trustScore += amount;
            }
            return;
        }
        }
    }
    
    //function that takes the decrease amouont and the DID and decreases the score
    function decreaseScore (string memory did, uint256 amount) internal {
        for (uint256 i = 0; i < trustScores.length; i++) {
            if (keccak256(bytes(trustScores[i].voterDID)) == keccak256(bytes(did))) {
                if(trustScores[i].trustScore < amount) {
                trustScores[i].trustScore = 0;
            } else {
                trustScores[i].trustScore -= amount;
            }
            return;
            }
        }
    }
    
    //takes in a DID and returns the score
    function retrieveScore (string memory did) public view returns (uint256) {
        for (uint256 i = 0; i < trustScores.length; i++) {
            if (keccak256(bytes(trustScores[i].voterDID)) == keccak256(bytes(did))) {
                return trustScores[i].trustScore;
            }
        }
    }

    //Function to Degreade Trust Scores Over Time if not actively engaged
    function degradeScore() public {
        uint256 twoWeeks = 2 * 7 * 24 * 60 * 60;
        for (uint256 i = 0; i < trustScores.length; i++) {
            if (block.timestamp - trustScores[i].timeOfLastVote > twoWeeks) {
                trustScores[i].trustScore -= 3;
                trustScores[i].timeOfLastVote = block.timestamp;
            }
        }
    }
    

    //Function for somebody to create a proposal which sets a time limit
    function createProposal(string memory DID, string memory claim, string memory evidence) public {
        proposals[DID].push(Proposal({
            owner: msg.sender,
            id: identifier,
            did: DID,
            claim: claim,
            evidence: evidence,
            voteStart: block.timestamp,
            voteEnd: block.timestamp + 2 minutes, //For Production purposes this would be modified to 1 week etc.
            executed: false,
            validated: false
        }));
        emit Creation(identifier);
        identifier++;
        
    }

    //Function for initiating a challenge to a proposal
    function challengeVote(uint256 proposalID, string memory proposer, string memory evidence) public{
        Proposal [] memory proposal = proposals[proposer];
        for (uint256 i = 0; i < proposal.length; i++) {
            if (proposal[i].id == proposalID){
                require(proposal[i].executed == true, "Original vote has not ended.");
                challenges[proposalID].push(Challenge({
                    challenger: msg.sender,
                    challengeID: challengeIdentifier,
                    newEvidence: evidence,
                    voteEnd: block.timestamp + 2 minutes, //For Production purposes this would be modified to 1 week etc.
                    resolved: false
                }));
            }
        }
        emit challengeCreation(challengeIdentifier);
        challengeIdentifier++;
        
    }

    //Function for an entity to vote on a challenge
    function voteOnChallenge(string memory voterDID, uint256 proposalID, uint256 challengeID, bool vote) public{
        
        //only owner of DID can vote as the DID
        require(registry.isOwner(voterDID, msg.sender), "Caller is not authorized to vote as this user");
        Challenge[] storage challenge = challenges[proposalID];

        //First check if the account is new, if <4 weeks old reduce the vote weighting
        uint256 score = 0;
        uint256 creationTime;
        uint256 currentScore;
        for (uint256 j = 0; j < trustScores.length; j++) {
            if (keccak256(bytes(trustScores[j].voterDID)) == keccak256(bytes(voterDID))) {
                currentScore = trustScores[j].trustScore;
                creationTime =  trustScores[j].creationTime;
                uint256 timeDiff = block.timestamp - creationTime; 
                if (timeDiff >= 4 weeks) {
                    score = currentScore;
                } else {
                    score = currentScore / 2; 
                }
                break; 
            }
        }
        //ensure the challenge vote has not ended
        for (uint256 i = 0; i < challenge.length; i++) {
            if (challenge[i].challengeID == challengeID) {
                require(!challenge[i].resolved, "Challenge already resolved.");

                //Vote in the challenge
                challengeVotes[challengeID].push(ChallengeVote({
                    voter: voterDID,
                    trustScore: score,
                    vote: vote
                }));

                emit Log("Vote cast successfully");
                break;
            }
        }


        emit Log("Vote cast successfuly");
                 
    }

    //Function for an entity to vote on a proposal
    function voteOnProposal(string memory voterDID, string memory proposerDID, uint256 proposalID, bool vote) public{
        
        require(registry.isOwner(voterDID, msg.sender), "Caller is not authorized to vote as this user");
        
        //Can only vote once every 12 hours.
        //For Showcase Purposes this is disabled, but in Production it would be enabled again.

        //bool eligable = false;
        //for (uint256 i = 0; i < trustScores.length; i++) {
        //    if (keccak256(bytes(trustScores[i].voterDID)) == keccak256(bytes(voterDID))) {
        //        uint256 timeSinceLastVote = block.timestamp - trustScores[i].timeOfLastVote;
        //        require(timeSinceLastVote > 12 * 60 * 60, "You must wait 12 hours between votes");
        //        eligable = true;
        //    }
        //}
        //require(eligable, "You must wait 12 hours between votes");
        
        Proposal[] memory proposal = proposals[proposerDID];
        for (uint i = 0; i < proposal.length; i++) {
            if (proposal[i].id == proposalID) {
                
                require(proposal[i].executed != true, "Proposal Vote has already terminated");
                
                uint256 score = 0;
                for (uint256 j = 0; j < trustScores.length; j++) {
                    if (keccak256(bytes(trustScores[j].voterDID)) == keccak256(bytes(voterDID))) {
                        uint256 currentScore = trustScores[j].trustScore;
                        uint256 creationTime =  trustScores[j].creationTime;
                        uint256 timeDiff = block.timestamp - creationTime; 
                        if (timeDiff >= 4 weeks) {
                            score = currentScore;
                        } else {
                            score = currentScore / 2; 
                        }
                        break; 
                    }
                }

                votes[proposal[i].id].push(Vote({
                    voter: voterDID,
                    trustScore: score,
                    vote: vote
                }));


                emit Log("Vote cast successfuly");
            }
            else{
                emit Log("Vote Failed, due to Proposal not being found");
                }
            }
    }

    function executeChallenge(uint256 challengeID, uint256 proposalID, string memory proposerDID) public {
        //retrieve challenge
        uint value = 0;
        Challenge[] storage challenge = challenges[proposalID];
        for (uint256 i = 0; i < challenge.length; i++) {
            if (challenge[i].challengeID == challengeID) {

                //check enough time has passed
                require(challenge[i].resolved != true, "Challenge Vote has already terminated");
                require(challenge[i].voteEnd <= block.timestamp, "Voting is not yet over");
                
                //calculate votes
                ChallengeVote[] memory challengeVote = challengeVotes[challengeID];
                for (uint i = 0; i < challengeVote.length; i++) {
                    uint value = challengeVote[i].trustScore * 1;
                    if (challengeVote[i].vote == true){
                        value += value;
                    } 
                    else{
                        value -= value;
                    }
                }

                bool result;
                //execute results
                if (value > 0) {
                    challenge[i].resolved = true;
                    //if decision is the same only modify strust scores for those who voted in the challenge
                    for (uint i = 0; i < challengeVote.length; i++) {
                        bool voteResult = challengeVote[i].vote == result;
                        for (uint j = 0; j < trustScores.length; j++) {
                        if (keccak256(bytes(trustScores[j].voterDID)) == keccak256(bytes(challengeVote[i].voter))) {
                            if (voteResult) {
                                trustScores[j].trustScore += 5;
                            } else {
                                trustScores[j].trustScore -= 3;
                            }
                            break;
                        }
                    }
                    }
                }
                else{
                    challenge[i].resolved = true;
                    //if opposite also reverse the trust scores on the original vote
                    for (uint i = 0; i < challengeVote.length; i++) {
                        bool voteResult = challengeVote[i].vote == result;
                        for (uint j = 0; j < trustScores.length; j++) {
                        if (keccak256(bytes(trustScores[j].voterDID)) == keccak256(bytes(challengeVote[i].voter))) {
                            if (voteResult) {
                                trustScores[j].trustScore += 5;
                            } else {
                                trustScores[j].trustScore -= 3;
                            }
                            break;
                        }
                    }}

                    //Modify Votes
                    Vote[] memory proposalsVotes = votes[proposalID];
                    for (uint i = 0; i < proposalsVotes.length; i++) {
                        string memory voterDID = proposalsVotes[i].voter;
                        bool voteResult = proposalsVotes[i].vote == result;
                        for (uint j = 0; j < trustScores.length; j++) {
                            if (keccak256(bytes(trustScores[j].voterDID)) == keccak256(bytes(voterDID))) {
                            
                                if (voteResult) {
                                    trustScores[j].trustScore += 5;
                                } else {
                                    trustScores[j].trustScore -= 3;
                                }
                                break;
                            }
                        }
                    }

                    //Modify original proposal to opposite of original decision.
                    Proposal[] storage originalProposal = proposals[proposerDID];
                    for (uint i = 0; i < originalProposal.length; i++) {
                        if (originalProposal[i].id == proposalID) {
                            if(originalProposal[i].validated == true){
                                originalProposal[i].validated = false;
                            }
                            else{originalProposal[i].validated = true;}
                        }
                    }

                    emit challengeExecuted(true);

                }              

            }
            else{emit Log("Could not find challenge to vote on");}     
        }
    }


    //Function that can be called to execute the proposal, which checks if time has expired, calculates the votes, and implements the changes
    function executeProposal(uint256 proposalID, string memory proposerDID) public{
        Proposal[] storage proposal = proposals[proposerDID];
        uint vote = 0;
        for (uint i = 0; i < proposal.length; i++) {
            if (proposal[i].id == proposalID) {
                require(proposal[i].executed != true, "Proposal Vote has already terminated");
                require(proposal[i].voteEnd <= block.timestamp, "Voting is not yet over");
                proposal[i].executed = true; 

                //calculate votes
                Vote[] memory proposalsVotes = votes[proposalID];
                for (uint i = 0; i < proposalsVotes.length; i++) {
                    uint value = proposalsVotes[i].trustScore * 1;
                    if (proposalsVotes[i].vote == true){
                        vote += value;
                    } 
                    else{
                        vote -= value;
                    }
                }

                bool result;
                //execute results
                if (vote > 0) {
                    proposal[i].validated = true;
                    result = true;
                }
                else{
                    proposal[i].validated = false;
                    result = false;
                }

                //Update Trust Scores
                for (uint i = 0; i < proposalsVotes.length; i++) {
                    string memory voterDID = proposalsVotes[i].voter;
                    bool voteResult = proposalsVotes[i].vote == result;
                    for (uint j = 0; j < trustScores.length; j++) {
                        if (keccak256(bytes(trustScores[j].voterDID)) == keccak256(bytes(voterDID))) {
                           
                            if (voteResult) {
                                trustScores[j].trustScore += 5;
                            } else {
                                trustScores[j].trustScore -= 3;
                            }
                            break;
                        }
                    }
                }

                emit execute(true);

            }else{
                emit Log("Something went wrong when executing proposal");
            }
        }

        
        
    }


}


