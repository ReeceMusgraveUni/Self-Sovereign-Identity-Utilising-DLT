import React, {Component} from 'react';
import registration from '../web3Deployments/registration';
import {Button, List, Dimmer, Loader, Grid, Modal} from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import web3 from '../web3';
import NavBar from '../pages/navbar';

class Registry extends Component {

    state = { privateKey: '', publicKey: '', publicKeyHash: '', isHovering:false, buttonClicked: false, loading: false, operationSuccessful: false, showModal: false, did: ''};
    
    //Generate new cryptographic keys using the off-chain function
    handleSubmit = async () => {
        
        this.setState({ loading: true });
        fetch('http://localhost:3001/api/generateKeys', { 
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
              throw new Error('Error has occured');
            }
            return response.json();
          })
        .then(keyPair => {
            this.setState({
                privateKey: keyPair.privateKeyBase64,
                publicKey: keyPair.publicKeyBase64,
                publicKeyHash: keyPair.hash,
                loading: false
            });
        })
        .catch(error => {
            console.error('Error:', error);
            this.setState({ loading: false });
        });
    }

    //set public key on chain for use before creating DID
    setPublicKey = async () => {
        this.setState({ isButtonClicked: true });
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            await registration.methods.setKeys(this.state.publicKeyHash).send({from: accounts[0]});

            //For Gas Testing Purposes
            /*
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await registration.methods.setKeys(this.state.publicKeyHash).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations of setKeys: ", (gas/100));
            */

            const key = await registration.methods.publicKey().call({ from: accounts[0] });
            if(key != this.state.publicKeyHash) throw new Error('Update on-chain did not finalise');
            this.setState({ loading: false, operationSuccessful: true });
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ isButtonClicked: false, loading:false });
        }
    };

    //Create the DID on-chain
    createDID = async () => {
        try{
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            let receipt = await registration.methods.registerDID().send({ from: accounts[0]});
            
            //Testing Purposes
            /*
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await registration.methods.registerDID().estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations of setKeys: ", (gas/100));
            */
           
            let didid = receipt.events.DIDCreated.returnValues.did;
            const { publicKey, publicKeyHash } = this.state;
            try{
                const response = await fetch('http://localhost:3001/api/storePublicKey', {
                    method: 'POST',
                    headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publicKey: publicKey, did: didid, hash: publicKeyHash })
                
            });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }catch(error){console.log('Could not store public keys', error)}
            
            this.setState({ loading: false, did: didid, showModal: true });
        }catch(error) {
            console.error('DID Not Created', error);
        }
    };

    //To be able to copy the keys to clipboard
    copyToClipboard = (text) => {
        if (navigator.clipboard) { 
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard'); 
            }, (err) => {
                console.error('Could not copy text: ', err);
            });
        } 
    };


    //Functions to reveal the private key/hide the private key
    handleMouseEnter = () => {
        this.setState({ isHovering: true });
    };
    handleMouseLeave = () => {
        this.setState({ isHovering: false });
    };
    
    render() {

        const listContainerStyle = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', 
            width: '100%',
            marginTop: '20px',
        };

        const scrollableListStyle = {
            maxHeight: '300px',
            overflowY: 'auto', 
            width: '80%',
        };

        return (
            <Grid centered style={{ height: '100vh'}}>
                <Grid.Column style={{ maxWidth: '100%' }}>
                    <div><NavBar /></div>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>    
                            <Button 
                                    style={{marginTop: '20px'}}
                                    onClick={this.handleSubmit}
                                    as="a">Generate Quantum Resistant Key Pair
                            </Button>
                        </div>    
                        {this.state.loading && (
                        <Dimmer active inverted>
                            <Loader size='large'>Loading</Loader>
                        </Dimmer>
                        )}

                        {this.state.privateKey &&  (
                            <div style={listContainerStyle}>
                                All Values are Base 64 for storage
                                <List celled style={scrollableListStyle}>
                                    <List.Item>
                                    <List.Content>
                                        <List.Header>Private Key (Hover To Reveal)</List.Header>
                                        <div style = {{opacity: this.state.isHovering ? 1 : 0}} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
                                        <Button icon='save' color='green' size='mini' onClick={() => this.copyToClipboard(this.state.privateKey)}></Button>
                                        {this.state.privateKey} 
                                        </div>
                                    </List.Content>
                                    </List.Item>
                                    {this.state.publicKey && (
                                        <List.Item>
                                        <List.Content>
                                            <List.Header>Public Key</List.Header>
                                            <Button icon='save' color='green' size='mini' onClick={() => this.copyToClipboard(this.state.publicKey)}></Button>
                                            {this.state.publicKey}</List.Content>
                                        </List.Item>
                                    )}
                                    <List.Item>
                                    <List.Content>
                                        <List.Header>Public Key Hash</List.Header>
                                        <Button icon='save' color='green' size='mini'onClick={() => this.copyToClipboard(this.state.publicKeyHash)}></Button>
                                        {this.state.publicKeyHash}
                                        </List.Content>
                                    </List.Item>
                                </List>
                            </div>
                        )}


                        {this.state.loading && (
                        <Dimmer active inverted>
                            <Loader size='large'>Loading</Loader>
                        </Dimmer>
                        )}
            
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>    
                        <Button 
                            style={{ marginTop: '20px', backgroundColor: this.state.isButtonClicked ? 'green' : undefined }}
                            onClick={this.setPublicKey}
                            disabled={this.state.isButtonClicked}>Set Public Key for DID Linking
                        </Button>
                    </div>

                    {this.state.loading && (
                        <Dimmer active inverted>
                            <Loader size='large'>Loading</Loader>
                        </Dimmer>
                        )}

                    {this.state.operationSuccessful && (
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '20px' }}>
                        <Button
                        onClick={this.createDID}
                        >
                            Register New DID
                        </Button>
                    </div>
                    )}   

                    {this.state.did && (
                    <Modal
                        open={this.state.showModal}
                        onClose={() => this.setState({ showModal: false })}
                        size='small'
                    >
                        <Modal.Header>Congratulations</Modal.Header>
                        <Modal.Content>
                            <p>Congrats on your new identity: {this.state.did}</p>
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => this.setState({ showModal: false })}>
                                Close
                            </Button>
                        </Modal.Actions>
                    </Modal>
                )}  

                </Grid.Column>   
                
        </Grid>
        );
    
    }

}
export default Registry;
