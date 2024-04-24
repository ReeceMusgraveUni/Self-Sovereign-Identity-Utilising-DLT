import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import NavBar from '../pages/navbar';
import { Grid, Card, Button, Form, Input, Modal , Loader, Dimmer, List} from 'semantic-ui-react';
import registry from '../web3Deployments/registry';
import credentialIssuance from '../web3Deployments/credentialIssuance';
import verification from '../web3Deployments/verification';
import web3 from '../web3';

class Identity extends Component {

    
    state = { loading: false , did: '', showModal: false, modalMessage: '', update: '', updateDID: '', type: '', controller: '', hash: '', newHash: '', newKey: '',
        issuerDID: '', holderDID: '', schema: '', requests: ''
    };

    //Deactivate DID: Function for calling the relevant smart contract
        //When work is being down a loading screen appears, and on completion, a pop-up message appears
    deactivateDID = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            await registry.methods.deactivateDID(this.state.did).send({from: accounts[0]});
            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await registry.methods.deactivateDID(this.state.did).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations of setKeys: ", (gas/100));
            */
            this.setState({ loading: false, showModal: true, modalMessage: 'You have successfuly deactivated your DID'});
        }catch(error){
            console.error('Error has occured', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong'});
        }
    };

    //Update Metadata: Function for calling the relevant smart contract
    updateMeta = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            await registry.methods.updateDocument(this.state.updateDID, this.state.update).send({from: accounts[0]});
            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await registry.methods.updateDocument(this.state.updateDID, this.state.update).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */
            this.setState({ loading: false , modalMessage: 'You have successfuly updated your metadata', showModal: true});
        }catch(error){
            console.error('Error has occured', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong'});
        }
    };

    //Add a new Verification Method: Function for calling the relevant smart contract
    addVerificationMethod = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            await registry.methods.addVerification(this.state.updateDID, this.state.type, this.state.controller, this.state.hash).send({ from: accounts[0]});
            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await registry.methods.addVerification(this.state.updateDID, this.state.type, this.state.controller, this.state.hash).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */
            this.setState({ loading: false , modalMessage: 'You have successfuly added a new Verification Method', showModal: true});
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong'});
        }
    };

    //register a new key in the issuer registry: Function for calling the relevant smart contract
    registerNewKey = async () => {
       
        try {
            //register public key on-chain
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            await registry.methods.registerPublicKey(this.state.newHash, this.state.updateDID).send({ from: accounts[0]});
            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await registry.methods.registerPublicKey(this.state.newHash, this.state.updateDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            gas = 0;
            for (let i = 0; i < 100; i++){
                let gasUsed = await registry.methods.retrieveKeys(this.state.updateDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */
            //Retrieve the public key from on-chain and off-chain
            const keys = await registry.methods.retrieveKeys(this.state.updateDID).call({from: accounts[0]});
            try{

                const response = await fetch('http://localhost:3001/api/storePublicKey', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'},
                    body: JSON.stringify({ publicKey: this.state.newKey, did: this.state.updateDID, hash: this.state.newHash })  
                });

                if (!response.ok) {
                    throw new Error(`Error when storing keys from off-chain: ${response.status}`);
                }

                //Showcase Success on Screen 
                if(keys.includes(this.state.newHash)){
                    this.setState({ loading: false , modalMessage: 'You have successfuly registered a new Public Key On-chain & Off-chain', showModal: true});
                    return true
                };
            
        //Catch Errors, and End Loading Screen with a Failure Message 
            }catch(error){
                console.log('Error has occured:', error)
                this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong'});
            }
            
            
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong'});
        }
    };

    //request a new Verifiable Credential: Function for calling the relevant smart contract
    newCredentialRequest = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            await credentialIssuance.methods.requestCredential(this.state.issuerDID, this.state.holderDID, this.state.schema).send({ from: accounts[0]});

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await credentialIssuance.methods.requestCredential(this.state.issuerDID, this.state.holderDID, this.state.schema).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            this.setState({ loading: false , modalMessage: 'You have successfuly requested a new Verifiable Credential', showModal: true});
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong'});
        }
    }

    //Retrieve all the Verification Requests for a DID: Function for calling the relevant smart contract
    retrieveVerificationRequests = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            let requests = await verification.methods.getVerificationRequests(this.state.holderDID).call({ from: accounts[0]});

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await verification.methods.getVerificationRequests(this.state.holderDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */
           
            this.setState({ loading: false, requests: requests});
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong'});
        }
    };

    //UI COMPONENTS
    render() {
        
        return (
            <div>
                <NavBar />
                    <Grid centered style={{ height: '100vh'}}>
                        <Grid.Column style={{ maxWidth: '100%' }}>
                
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {this.state.loading && (
                                    <Dimmer active inverted>
                                        <Loader size='large'>Loading</Loader>
                                    </Dimmer>
                                )}
                                <Card.Group itemsPerRow={3} stackable>
                                    <Card
                                        header='Update Documents MetaData'
                                        meta='The metadata string value can be modified to your choosing. Please fill in all fields.'
                                        extra = {
                                            <Form > {}
                                                <Input
                                                    style={{ width: '60%' }}
                                                    placeholder='Input DID'
                                                    value={this.state.updateDID} 
                                                    onChange={(e) => this.setState({ updateDID: e.target.value })}
                                                />
                                                <Input
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Input Updated MetaData as String'
                                                    value={this.state.update} 
                                                    onChange={(e) => this.setState({ update: e.target.value })}
                                                    action={{
                                                        content: 'Update',
                                                        onClick: this.updateMeta, 
                                                    }}
                                                />
                                            </Form>
                                        }
                                    />
                                    <Card
                                        header='Deactivate your DID'
                                        meta='Deactivate your DID & the corresponding DID Document. Please fill in all fields.'
                                        extra = {
                                            <Form > {}
                                                <Input
                                                    style={{ width: '60%' }}
                                                    placeholder='Input DID to deactivate...'
                                                    value={this.state.did} 
                                                    onChange={(e) => this.setState({ did: e.target.value })}
                                                    action={{
                                                        content: 'Deactivate',
                                                        onClick: this.deactivateDID, 
                                                    }}
                                                />
                                            </Form>
                                        }
                                    />
                                    <Card
                                        header='Add Verification Method'
                                        meta='Add a new Verification Method to be added to your DID Document. Please fill in all fields.'
                                        extra = {
                                            <Form > {}
                                                <Input
                                                    style={{ width: '60%' }}
                                                    placeholder='DID'
                                                    value={this.state.updateDID} 
                                                    onChange={(e) => this.setState({ updateDID: e.target.value })}
                                                />
                                                <Input
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Type of Verification Method'
                                                    value={this.state.type} 
                                                    onChange={(e) => this.setState({ type: e.target.value })}
                                                />
                                                <Input
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Controller of Method'
                                                    value={this.state.controller} 
                                                    onChange={(e) => this.setState({ controller: e.target.value })}
                                                />
                                                <Input
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Public Key Hash'
                                                    value={this.state.hash} 
                                                    onChange={(e) => this.setState({ hash: e.target.value })}
                                                    action={{
                                                        content: 'Add',
                                                        onClick: this.addVerificationMethod, 
                                                    }}
                                                />
                                            </Form>
                                        }
                                    />
                                    <Card
                                        header='Register New Public Key'
                                        meta='This method is for use by Issuers, who want to upload their public keys for later use by Verifiers. The function will register the hash on-chain and the key off-chain. Please fill in all fields.'
                                        extra = {
                                            <Form > {}
                                                <Input
                                                    style={{ width: '60%' }}
                                                    placeholder='DID'
                                                    value={this.state.updateDID} 
                                                    onChange={(e) => this.setState({ updateDID: e.target.value })}
                                                />
                                                <Input
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Hash of new public Key'
                                                    value={this.state.newHash} 
                                                    onChange={(e) => this.setState({ newHash: e.target.value })}
                                                />
                                                <Input
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Public Key'
                                                    value={this.state.newKey} 
                                                    onChange={(e) => this.setState({ newKey: e.target.value })}
                                                    action={{
                                                        content: 'Register',
                                                        onClick: this.registerNewKey, 
                                                    }}
                                                />
                                            </Form>
                                        }
                                    />
                                    <Card
                                        header='Request a new Verifiable Credential'
                                        meta='Request a new Verifiable Credential from a known Issuer using their DID. Please fill in all fields.'
                                        extra = {
                                            <Form > {}
                                                <Input required
                                                    style={{ width: '60%' }}
                                                    placeholder='Issuers DID'
                                                    value={this.state.issuerDID} 
                                                    onChange={(e) => this.setState({ issuerDID: e.target.value })}
                                                />
                                                <Input
                                                    required
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Your DID'
                                                    value={this.state.holderDID} 
                                                    onChange={(e) => this.setState({ holderDID: e.target.value })}
                                                />
                                                <Input
                                                    required
                                                    style={{ width: '60%', marginTop: '10px' }}
                                                    placeholder='Requested Schema'
                                                    value={this.state.schema} 
                                                    onChange={(e) => this.setState({ schema: e.target.value })}
                                                    action={{
                                                        content: 'Request',
                                                        onClick: this.newCredentialRequest, 
                                                    }}
                                                />
                                            </Form>
                                        }
                                    />
                                    <Card
                                        header='Check for Verification Requests'
                                        meta='Check to see if there are any active requests to verify your credentials. Please fill in all fields.'
                                        extra = {
                                            <div>
                                                <Form > {}
                                                    <Input
                                                        style={{ width: '60%', marginTop: '10px' }}
                                                        placeholder='Input your DID...'
                                                        value={this.state.holderDID} 
                                                        onChange={(e) => this.setState({ holderDID: e.target.value })}
                                                        action={{
                                                            content: 'Retrieve',
                                                            onClick: this.retrieveVerificationRequests, 
                                                        }}
                                                    />
                                                </Form>
                                                {this.state.requests &&  ( 
                                                    <List celled>
                                                        {this.state.requests.map((method, index) => (
                                                            <List.Item key={index}>
                                                            <List.Content>
                                                                <List.Header>Verification  Request</List.Header>
                                                                    DID: {method.holderDID}<br/>
                                                                    Verifier: {method.verifierDID}<br/>
                                                                    Active Request: {method.isActive ? 'True' : 'False'}<br/>
                                                                    Request: {method.requestInfo}
                                                            </List.Content>
                                                            </List.Item>
                                                        ))}
                                                    </List>
                                                )}
                                            </div>
                                        }
                                    />
                                </Card.Group>
                            </div>
                    
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
                        </Grid.Column>
                    </Grid>
            </div>
        )
    }


}
export default Identity;


