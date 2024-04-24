import React, {Component, useRef} from 'react';
import reCAPTCHA from "react-google-recaptcha";
import registry from '../web3Deployments/registry';
import CommunityVoting from '../web3Deployments/CommunityVoting'
import NavBar from '../pages/navbar';
import Link from 'next/link';
import 'semantic-ui-css/semantic.min.css';
import { Input, Form, Loader, Dimmer, List, Button, Grid, Modal } from 'semantic-ui-react';
import web3 from '../web3';



class Community extends Component {
    
    state = {startForm: '', startVote: '', startChallengeVote: '',  did: '', id: '', loading: false, showModal: false, modalMessage: '', proposal: '', proposerClaim: '', proposerEvidence: '', proposerDID: '',
            initialiseDID: '', retrieveDID: '', executed: '', validated: '', voteDID: '', voteVote: '', votePropId: '', votePropDID: '', executePropID: '', executeProposerDID:'',
            executeOpen: '', challengePropId: '', challengeProposer: '', challengeEvidence: '', challengeOpen: '', voteChalVoter: '', voteChalPropID: '', voteChalID: '', voteChalVote: '',
            executeChalChalId: '', executeChalPropId: '', retrieveChallengeChalID: '', retrieveChallengePropID: '', challenge: '', challengeExecuted:'', challengeOpenExecute: '', startChal: '', executeChalProposerDID: ''};


    retrieveProposal = async () => {
        try{
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.getProposal(this.state.did, this.state.id).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            const proposal = await CommunityVoting.methods.getProposal(this.state.did, this.state.id).call({from: accounts[0]}); 
            this.setState({ loading: false, proposal: proposal});
            console.log(proposal);
            if(proposal[7] == true){this.setState({executed:true})}
            if(proposal[8] == true){this.setState({validated:true})}
        }
        catch(error){
            this.setState({ loading: false, showModal: true, modalMessage: 'Could not retrieve Proposal.'});
            console.log(error);
        }
    };

    retrieveChallenge = async () => {
        try{
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.getChallenge(this.state.retrieveChallengePropID, this.state.retrieveChallengeChalID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */
            const challenge = await CommunityVoting.methods.getChallenge(this.state.retrieveChallengePropID, this.state.retrieveChallengeChalID).call({from: accounts[0]}); 
            this.setState({ loading: false, challenge: challenge});
            if(challenge[4] == true){this.setState({challengeExecuted:true})}
            console.log(challenge);
        }
        catch(error){
            this.setState({ loading: false, showModal: true, modalMessage: 'Could not retrieve Proposal.'});
            console.log(error);
        }
    };

    createProposal = async () => {
        try{
            this.setState({ loading: true, startForm: '' });
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.createProposal(this.state.proposerDID, this.state.proposerClaim, this.state.proposerEvidence).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            const proposal = await CommunityVoting.methods.createProposal(this.state.proposerDID, this.state.proposerClaim, this.state.proposerEvidence).send({from: accounts[0]});
            const proposalID = proposal.events.Creation.returnValues.identifier.toString();
            this.setState({ loading: false, showModal: true, modalMessage:`Successfully created proposal with id: ${proposalID}`});
        }
        catch{
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed when making Proposal.'});
        }
    };

    voteOnProposal = async () => {
        try{
            this.setState({ loading: true, startVote: '' });
            const accounts = await web3.eth.getAccounts();
            const voteVoteBool = this.state.voteVote === 'true';

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.voteOnProposal(this.state.voteDID, this.state.votePropDID, this.state.votePropId, voteVoteBool).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            const vote = await CommunityVoting.methods.voteOnProposal(this.state.voteDID, this.state.votePropDID, this.state.votePropId, voteVoteBool).send({from: accounts[0]});
            this.setState({ loading: false, showModal: true, modalMessage:`Successfully Voted`});
        }
        catch(error){
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed to Vote.'});
            console.log(error);
        }
    };
    
    createChallenge = async () => {
        try{
            this.setState({ loading: true, challengeOpen: ''});
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.challengeVote(this.state.challengePropId, this.state.challengeProposer, this.state.challengeEvidence).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            const vote = await CommunityVoting.methods.challengeVote(this.state.challengePropId, this.state.challengeProposer, this.state.challengeEvidence).send({from: accounts[0]});
            const challengeID = vote.events.challengeCreation.returnValues.message.toString();
            this.setState({ loading: false, showModal: true, modalMessage:`Successfully created challenge with id: ${challengeID}`});
        }
        catch(error){
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed to challenge Vote.'});
            console.log(error);
        }
    };

    voteOnChallenge = async () => {
        try{
            this.setState({ loading: true, startChallengeVote: ''});
            const accounts = await web3.eth.getAccounts();
            const chalVoteBool = this.state.voteChalVote === 'true';

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.voteOnChallenge(this.state.voteChalVoter, this.state.voteChalPropID, this.state.voteChalID, chalVoteBool).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            const vote = await CommunityVoting.methods.voteOnChallenge(this.state.voteChalVoter, this.state.voteChalPropID, this.state.voteChalID, chalVoteBool).send({from: accounts[0]});
            this.setState({ loading: false, showModal: true, modalMessage:`Voted on Challenge Successfuly`, startChallengeVote: ''});
        }
        catch(error){
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed to vote on challenge.', startChallengeVote: ''});
            console.log(error);
        }
    };

    executeProposal = async () => {
        try{
            this.setState({ loading: true, executeOpen: ''});
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.executeProposal(this.state.executePropID, this.state.executeProposerDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            await CommunityVoting.methods.executeProposal(this.state.executePropID, this.state.executeProposerDID).send({from: accounts[0]});
            this.setState({ loading: false, showModal: true, modalMessage:`Executed Vote Successfuly`});
        }
        catch(error){
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed to Execute Vote.'});
            console.log(error);
        }
    };

    executeChallenge = async () => {
        try{
            this.setState({ loading: true, challengeOpenExecute: ''});
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.executeChallenge(this.state.executeChalChalId, this.state.executeChalPropId, this.state.executeChalProposerDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            const vote = await CommunityVoting.methods.executeChallenge(this.state.executeChalChalId, this.state.executeChalPropId, this.state.executeChalProposerDID).send({from: accounts[0]});
            this.setState({ loading: false, showModal: true, modalMessage:`Executed Challenge Vote Successfuly`});
        }
        catch(error){
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed to Execute Challenge Vote.'});
            console.log(error);
        }
    };

    initiateScore = async () => {
        try{
            this.setState({ loading: true});
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.initialiseScore(this.state.initialiseDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            await CommunityVoting.methods.initialiseScore(this.state.initialiseDID).send({from: accounts[0]});
            this.setState({ loading: false, showModal: true, modalMessage: 'Successfully Initiated Score for given DID'});
        }
        catch{
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed when initiating score. Has this already been done?'});
        }
    };

    retrieveScore = async () => {
        try{
            this.setState({ loading: true});
            const accounts = await web3.eth.getAccounts();

            
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await CommunityVoting.methods.retrieveScore(this.state.retrieveDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            

            const score = await CommunityVoting.methods.retrieveScore(this.state.retrieveDID).call({from: accounts[0]});
            console.log(score);
            this.setState({ loading: false, showModal: true, modalMessage: `You Trust Score Is: ${score} `});
        }
        catch{
            this.setState({ loading: false, showModal: true, modalMessage: 'Failed to retrieve score'});
        }
    };




    render() {
      
        const centerStyle = {
          display: 'flex',
          flexDirection: 'column', 
          justifyContent: 'flex-start', 
          paddingTop: '15vh', 
          alignItems: 'center', 
          height: '100vh', 
        };
        const inputStyle = {
          width: '50%', 
          marginTop: '30px',
        };
  
        
        return (
          
          <Grid centered style={{ height: '100vh'}}>
            <Grid.Column style={{ maxWidth: '100%' }}>
              <div>
                <NavBar />
                  <div style={centerStyle}>
                    <Modal
                        open={this.state.showModal}
                        onClose={() => this.setState({ showModal: false })}
                        size='small'
                    >
                        <Modal.Content>
                            <p>{this.state.modalMessage}</p>
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => this.setState({ showModal: false })}>
                                Close
                            </Button>
                        </Modal.Actions>
                    </Modal>
                    <div style={{ display: 'flex', gap: '50px' }}>
                        <div style={inputStyle}>
                            <Form > {}
                            <Input
                                style={{ width: '100%' }}
                                placeholder='Search for a proposal with Proposal ID'
                                value={this.state.id} 
                                onChange={(e) => this.setState({ id: e.target.value })}
                                
                                />
                                <Input
                                style={{ width: '100%' }}
                                placeholder='and the DID of Proposer'
                                value={this.state.did} 
                                onChange={(e) => this.setState({ did: e.target.value })}
                                action={{
                                    icon: 'search',
                                    onClick: this.retrieveProposal, 
                                }}
                                />
                            </Form>
                            {this.state.proposal && (
                            <div>
                            <List celled>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Owner</List.Header>
                                    {this.state.proposal[0]}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Proposal ID</List.Header>
                                    {this.state.proposal[1].toString()}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>DID of Proposer</List.Header>
                                    {this.state.proposal[2]}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Claim</List.Header>
                                    {this.state.proposal[3]}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Evidence</List.Header>
                                    {this.state.proposal[4]}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Start time of Vote</List.Header>
                                    {this.state.proposal[5].toString()}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>End time of Vote</List.Header>
                                    {this.state.proposal[6].toString()}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Executed?</List.Header>
                                    {this.state.proposal[7]? 'True' : 'False'}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Validated?</List.Header>
                                    {this.state.proposal[8]? 'True' : 'False'}
                                    </List.Content>
                                </List.Item>
                            </List>
                            <Button 
                                style={{
                                    marginTop: '10px',
                                    backgroundColor: this.state.executed ? '#d3d3d3' : '#17e31e',
                                    color: this.state.executed ? 'white' : '', 
                                    pointerEvents: this.state.executed ? 'none' : '', 
                                    cursor: this.state.executed ? 'default' : 'pointer',
                                }}
                                onClick={() => this.setState({executeOpen: true})}
                                as='a'>Execute Proposal
                            </Button>
                            {this.state.executeOpen && (
                                <Form>
                                <Input 
                                    fluid
                                    placeholder='Proposal Id'
                                    value={this.state.executePropID} 
                                    onChange={(e) => this.setState({ executePropID: e.target.value })}
                                />
                                
                                <Input 
                                    fluid
                                    placeholder='Proposers DID'
                                    value={this.state.executeProposerDID} 
                                    onChange={(e) => this.setState({ executeProposerDID: e.target.value })}
                                    action={{
                                        content: 'Execute',
                                        onClick: this.executeProposal, 
                                    }}
                                />
                                
                                </Form>
                            )}

                            <Button 
                                style={{
                                    marginTop: '10px',
                                    backgroundColor: !this.state.executed ? '#d3d3d3' : '#17e31e',
                                    color: !this.state.executed ? 'white' : '', 
                                    pointerEvents: !this.state.executed ? 'none' : '', 
                                    cursor: !this.state.executed ? 'default' : 'pointer',
                                }}
                                onClick={() => this.setState({challengeOpen: true})}
                                as='a'>Challenge Proposal
                            </Button>
                            {this.state.challengeOpen && (
                                <Form>
                                <Input 
                                    fluid
                                    placeholder='Proposal Id'
                                    value={this.state.challengePropId} 
                                    onChange={(e) => this.setState({ challengePropId: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='DID of Proposer'
                                    value={this.state.challengeProposer} 
                                    onChange={(e) => this.setState({ challengeProposer: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Evidence'
                                    value={this.state.challengeEvidence} 
                                    onChange={(e) => this.setState({ challengeEvidence: e.target.value })}
                                    action={{
                                        content: 'Create',
                                        onClick: this.createChallenge, 
                                    }}
                                />
                                
                                </Form>
                            )}
                            </div>
                        )}
                        </div>
                        <div style={inputStyle}>
                            <Form > {}
                            <Input
                                style={{ width: '100%' }}
                                placeholder='Search for a challenge with Proposal ID'
                                value={this.state.retrieveChallengePropID} 
                                onChange={(e) => this.setState({ retrieveChallengePropID: e.target.value })}
                                
                                />
                                <Input
                                style={{ width: '100%' }}
                                placeholder='and the Challenge ID'
                                value={this.state.retrieveChallengeChalID} 
                                onChange={(e) => this.setState({ retrieveChallengeChalID: e.target.value })}
                                action={{
                                    icon: 'search',
                                    onClick: this.retrieveChallenge, 
                                }}
                                />
                            </Form>
                            {this.state.challenge && (
                            <div>
                            <List celled>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Challenger</List.Header>
                                    {this.state.challenge[0]}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>challengeID</List.Header>
                                    {this.state.challenge[1].toString()}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>Evidence</List.Header>
                                    {this.state.challenge[2]}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>voteEnd</List.Header>
                                    {this.state.challenge[3].toString()}
                                    </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Content>
                                    <List.Header>resolved</List.Header>
                                    {this.state.challenge[4]? 'True' : 'False'}
                                    </List.Content>
                                </List.Item>
                               
                            </List>
                            <Button 
                                style={{
                                    marginTop: '10px',
                                    backgroundColor: this.state.challengeExecuted ? '#d3d3d3' : '#17e31e',
                                    color: this.state.challengeExecuted ? 'white' : '', 
                                    pointerEvents: this.state.challengeExecuted ? 'none' : '', 
                                    cursor: this.state.challengeExecuted ? 'default' : 'pointer',
                                }}
                                onClick={() => this.setState({challengeOpenExecute: true})}
                                as='a'>Execute Challenge
                            </Button>

                            {this.state.challengeOpenExecute && (
                                <Form > {}
                                    <Input
                                    style={{ width: '100%' }}
                                    placeholder='Proposal ID'
                                    value={this.state.executeChalPropId} 
                                    onChange={(e) => this.setState({ executeChalPropId: e.target.value })} 
                                    />
                                    <Input
                                    style={{ width: '100%' }}
                                    placeholder='Proposers DID'
                                    value={this.state.executeChalProposerDID} 
                                    onChange={(e) => this.setState({ executeChalProposerDID: e.target.value })} 
                                    />
                                    <Input
                                    style={{ width: '100%' }}
                                    placeholder='Challenge ID'
                                    value={this.state.executeChalChalId} 
                                    onChange={(e) => this.setState({ executeChalChalId: e.target.value })}
                                    action={{
                                        content: 'Execute',
                                        onClick: this.executeChallenge, 
                                    }}
                                    />
                                </Form>
                            )}
                        </div>
                            
                        )}
                    </div>

                    </div>
  
                    {this.state.loading && (
                      <Dimmer active inverted>
                        <Loader size='large'>Loading</Loader>
                      </Dimmer>
                    )}
  
                    <div>
                        <Button 
                        style={{marginTop: '100px'}}
                        onClick={() => this.setState({startForm: true})}
                        as='a'>Create a New Proposal
                        </Button>
                        {this.state.startForm && (
                            <div>
                                <Form>
                                <Input 
                                    fluid
                                    placeholder='Your DID'
                                    value={this.state.proposerDID} 
                                    onChange={(e) => this.setState({ proposerDID: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Claim'
                                    value={this.state.proposerClaim} 
                                    onChange={(e) => this.setState({ proposerClaim: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Evidence'
                                    value={this.state.proposerEvidence} 
                                    onChange={(e) => this.setState({ proposerEvidence: e.target.value })}
                                    action={{
                                        content: 'Create',
                                        onClick: this.createProposal, 
                                    }}
                                />
                                
                                </Form>
                            </div>
                        )}

                        <Button 
                          style={{marginTop: '100px'}}
                          onClick={() => this.setState({startVote: true})}
                          as='a'>Vote on Proposal
                        </Button>
                        {this.state.startVote && (
                            <div>
                                <Form>
                                <Input 
                                    fluid
                                    placeholder='Your DID'
                                    value={this.state.voteDID} 
                                    onChange={(e) => this.setState({ voteDID: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='DID of the Proposer'
                                    value={this.state.votePropDID} 
                                    onChange={(e) => this.setState({ votePropDID: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Proposal ID'
                                    value={this.state.votePropId} 
                                    onChange={(e) => this.setState({ votePropId: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Vote: true or false'
                                    value={this.state.voteVote} 
                                    onChange={(e) => this.setState({ voteVote: e.target.value })}
                                    action={{
                                        content: 'Create',
                                        onClick: this.voteOnProposal, 
                                    }}
                                />
                                
                                </Form>
                            </div>
                        )}
                        <Button 
                          style={{marginTop: '100px'}}
                          onClick={() => this.setState({startChallengeVote: true})}
                          as='a'>Vote on Challenge
                        </Button>
                        {this.state.startChallengeVote && (
                            <div>
                                <Form>
                                <Input 
                                    fluid
                                    placeholder='Your DID'
                                    value={this.state.voteChalVoter} 
                                    onChange={(e) => this.setState({ voteChalVoter: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Proposal ID'
                                    value={this.state.voteChalPropID} 
                                    onChange={(e) => this.setState({ voteChalPropID: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Challenge ID'
                                    value={this.state.voteChal} 
                                    onChange={(e) => this.setState({ voteChalID: e.target.value })}
                                />
                                <Input 
                                    fluid
                                    placeholder='Vote: true or false'
                                    value={this.state.voteChalVote} 
                                    onChange={(e) => this.setState({ voteChalVote: e.target.value })}
                                    action={{
                                        content: 'Create',
                                        onClick: this.voteOnChallenge, 
                                    }}
                                />
                                
                                </Form>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <Input 
                            style={{ width: '100%' }}
                            placeholder='Initialise Trust Score'
                            value={this.state.initialiseDID} 
                            onChange={(e) => this.setState({ initialiseDID: e.target.value })}
                            action={{
                                content: 'Initialise',
                                onClick: this.initiateScore, 
                            }}
                        />
                        <Input 
                            style={{ width: '100%' }}
                            placeholder='Retrieve Trust Score'
                            value={this.state.retrieveDID} 
                            onChange={(e) => this.setState({ retrieveDID: e.target.value })}
                            action={{
                                content: 'Retrieve',
                                onClick: this.retrieveScore, 
                            }}
                        />
                    </div>
                  </div>
                </div>
              </Grid.Column>   
          </Grid>
        );
      }  
               
}


export default Community;