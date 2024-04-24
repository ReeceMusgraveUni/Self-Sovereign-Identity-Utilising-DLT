import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid, GridRow, GridColumn, Loader, Dimmer, Card, CardGroup, List, ListItem, Form, Input, Modal, Button, Header } from 'semantic-ui-react';
import NavBar from '../pages/navbar';
import web3 from '../web3';
import registry from '../web3Deployments/registry';
import verification from '../web3Deployments/verification';
import credentialIssuance from '../web3Deployments/credentialIssuance';
import accessControl from '../web3Deployments/accessControl';

class Verification extends Component {

    state = { loading: '', issuerDID: '', buttonClicked: '', issuerKeys: '', verifierDID: '', holderDID: '', request: '', modalMessage: '', showModal: '',
                attribute: '', credentialFile: '', inputFile: '', setHolderDID: '', logHolderDID: '', logVerifierDID: '', logCredentialHash: '',
                revokeCredentialHash: '', revokeHolderDID: '', revokeVerifierDID: '', consentHolderDID: '', consentLogs: ''}


    //Function that retrieves the issuers keys from on-chain
    searchForIssuer = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            const keys = await registry.methods.retrieveKeys(this.state.issuerDID).call({from: accounts[0]});
            console.log(keys);
            if (keys[0] != ''){
                this.setState({ loading: false, issuerKeys: keys});
            }else{this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});}
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});
        }  
    };

    //Function for requesting a credential of a Holder
    requestCredential = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await verification.methods.requestVerification(this.state.verifierDID, this.state.holderDID, this.state.request ).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */
            await verification.methods.requestVerification(this.state.verifierDID, this.state.holderDID, this.state.request ).send({ from: accounts[0]});
            this.setState({ loading: false , modalMessage: 'You have successfuly requested a credential from the holder', showModal: true});
        }catch(error){
            console.error('Error has occured', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});
        }  
    };

    //Function which reads the input file into credentialFile
    credentialInput= (event) => {
        const inputFile = event.target.files[0];
        if (!inputFile) {
            return;
        }
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
            try {
                const json = JSON.parse(loadEvent.target.result);
                this.setState({ credentialFile: json });
            } catch (error) {
                console.error('Error has occured', error);
            }
        };
        fileReader.readAsText(inputFile)
        
    };


    //function which reads the input file into inputFile
    verifiableInput = (event) => {
        const inputFile = event.target.files[0];
        if (!inputFile) {
            return;
        }
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
            try {
                const json = JSON.parse(loadEvent.target.result);
                this.setState({ inputFile: json });
            } catch (error) {
                console.error('Error has occured', error);
            }
        };
        fileReader.readAsText(inputFile)
        
    };

    //function for automatically downloading a file
    generateAndDownloadJSON = (data) => {
        const fileData = JSON.stringify(data, null, 2);
        const blob = new Blob([fileData], { type: 'application/json' });
    
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'credential-components.json';
        link.href = url;
    
        link.click();
    
        URL.revokeObjectURL(url);
    };


    //Function for creating the attribute file
    createFile = async () => {
        try{
            this.setState({ loading: true });
            const { credentialFile, attribute } = this.state;
            const attributeEntry = credentialFile.output.find(entry => {
                return entry[0] === attribute;
            });
            if (attributeEntry) {
                //Get all of the required items for the file
                const [_, hash, proof] = attributeEntry;
                const sig = credentialFile.signature;
                const tree = credentialFile.tree;
                const root = credentialFile.root;
                const issuer = credentialFile.values.issuer;
                const attributeValue = credentialFile.values.credentialSubject[attribute];
                const dataToDownload = {
                    sig,
                    hash,
                    proof,
                    tree,
                    root,
                    issuer,
                    attributeValue
                };
                //Set file to download
                this.generateAndDownloadJSON(dataToDownload);
                this.setState({ loading: false });
            }else {
                console.error('Attribute not found in the credential');
                this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});
                return; 
            }
        }catch(error){'failed to create file', error}
    };


    //Function that verifies the attribute/credential -> Signature, Inclusion, and On-chain root
    verifyCredential = async () => {
        try{
            this.setState({ loading: true });
            const { inputFile, setHolderDID} = this.state;
            const issuer = inputFile.issuer;
            const attribute = inputFile.attributeValue;
            //retrieve Public Key hashes from on-chain
            const accounts = await web3.eth.getAccounts();
            const keys = await registry.methods.retrieveKeys(issuer).call({from: accounts[0]});
            //Retrieve the actual associated public key from off-chain storage
            try{
                const response = await fetch('http://localhost:3001/api/retrieveKey', {
                    method: 'POST',
                    headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({ did: issuer })
                
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                let keyPair;    //Hash and publicKeyHex
                for(let i = 0; i < keys.length; i++){
                    keyPair = data.find(pair => pair.hash === keys[i]);
                    break;
                }
                //Verify Attribute is part of credential
                const requestBody = {
                    hash: inputFile.hash, 
                    proof: inputFile.proof, 
                    root: inputFile.root
                };
                try{
                    const response = await fetch('http://localhost:3001/api/verifyAttributeMembership', {
                        method: 'POST',
                        headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                    
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const included = await response.json()
                    
                    //Confirm root is a valid root stored on-chain

                    /*
                    //Testing Purposes
                    let gas = 0
                    for (let i = 0; i < 100; i++){
                        let gasUsed = await credentialIssuance.methods.checkCredential(inputFile.root, setHolderDID).estimateGas({ from: accounts[0] });
                        gas += Number(gasUsed);
                    }
                    console.log("Average Gas Over 100 Iterations: ", (gas/100));
                    */

                    const onChain = await credentialIssuance.methods.checkCredential(inputFile.root, setHolderDID).call({from: accounts[0]});
                    if(onChain == true){
                        //Verify Signature is valid from Issuer
                        console.log(inputFile.sig);
                        console.log(keyPair.publicKeyHex);
                        try{
                            const Body = {
                                signature: inputFile.sig, 
                                publicKey: keyPair.publicKeyHex
                            };
                            const response = await fetch('http://localhost:3001/api/verifySignature', {
                                method: 'POST',
                                headers: {
                            'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(Body)
                            
                            });
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            const included = await response.json()
                            if(included != false){
                                //Produce Modal for Success

                                this.setState({ loading: false, modalMessage: ('Successfully Verified Attribute: '+ attribute ), showModal: true });
                            }
                            else{
                                //Produce Modal for Failure
                                this.setState({ loading: false, modalMessage: 'Unsuccessful Verification (UNABLE TO VERIFY ATTRIBUTE)', showModal: true });
                            }
                            
                        }catch(error){'Error Verifying Signature', error}
                    }


                }catch(error){'Error when verifying attribute inclusion'}

            }catch(error){'failure retrieving public key', error};
            
        }catch (error) {
            console.error('Something went wrong when verifying credential', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful' });
        }
    }


    //Function for logging consent
    logConsent = async () => {
        try{
            this.setState({ loading: true });
            const { logHolderDID, logCredentialHash, logVerifierDID} = this.state;
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await accessControl.methods.logConsent(logHolderDID, logVerifierDID, logCredentialHash).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            const receipt = await accessControl.methods.logConsent(logHolderDID, logVerifierDID, logCredentialHash).send({ from: accounts[0]});
            //Confirm it was done correctly:
            const consentLogged = receipt.events.Log;
            if(consentLogged){
                this.setState({ loading: false, showModal: true, modalMessage: 'Successfully Added a new Consent Log' });
            }
            else{
                console.error('failed to log consent log');
                this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});
            }
            
        }
        catch(error){
            console.log('Failed to log consent', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});
        }
    };

    //Function for revoking consent of an existing consent
    revokeConsent = async () => {
        
        /*
        //Testing Purposes
        const accounts = await web3.eth.getAccounts();      
        const { revokeHolderDID, revokeCredentialHash, revokeVerifierDID} = this.state
        let gas = 0
        for (let i = 0; i < 100; i++){
            let gasUsed = await accessControl.methods.revokeConsent(revokeCredentialHash, revokeHolderDID, revokeVerifierDID).estimateGas({ from: accounts[0] });
            gas += Number(gasUsed);
        }
        console.log("Average Gas Over 100 Iterations: ", (gas/100));
        */

        try{
            this.setState({ loading: true });
            const { revokeHolderDID, revokeCredentialHash, revokeVerifierDID} = this.state;
            const accounts = await web3.eth.getAccounts();            
            const receipt = await accessControl.methods.revokeConsent(revokeCredentialHash, revokeHolderDID, revokeVerifierDID).send({ from: accounts[0]});
            //Confirm it was done correctly:
            const consentLogged = receipt.events.Log;
            if(consentLogged){
                this.setState({ loading: false, showModal: true, modalMessage: 'Successfully revoked an existing Consent Log' });
            }
            else{
                console.error('failed to revoke consent log');
                this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});}
            
        }
        catch(error){
            console.log('Failed to revoke consent', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});
        }
    };


    //Function for retrieving all of the consent logs
    retrieveConsent = async () => {
        try{
            this.setState({ loading: true });
            const {consentHolderDID} = this.state;
            const accounts = await web3.eth.getAccounts();

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await accessControl.methods.returnConsentLogs(consentHolderDID).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */
           
            const logs = await accessControl.methods.returnConsentLogs(consentHolderDID).call({from: accounts[0]});
            this.setState({ loading: false, consentLogs: logs});
            
        }
        catch(error){
            console.log('Failed to retrieve consent', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Operation was not successful'});
        }
    };

    render(){
        
        return (
            
                    <div>
                        <NavBar />
                        {this.state.loading && (
                            <Dimmer active inverted>
                                <Loader size='large'>Loading</Loader>
                            </Dimmer>
                        )}
                        <Grid columns={2} divided>
                            <GridRow>
                            <GridColumn style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
                                <div style={{ flexGrow: 1 }}>
                                    <List>
                                        <ListItem>
                                            <CardGroup itemsPerRow={1} stackable style={{ height: '100%' }}>
                                                <Card fluid>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '100%', 
                                                    padding: '20px' 
                                                }}>
                                                    Retrieve List of Issuers Keys
                                                    <div style={{ width: '80%', marginTop: '20px' }}>
                                                        <Form > {}
                                                            <Input 
                                                                fluid
                                                                placeholder='Input the issuers DID'
                                                                value={this.state.issuerDID} 
                                                                onChange={(e) => this.setState({ issuerDID: e.target.value })}
                                                                action={{
                                                                    content: 'Search',
                                                                    onClick: this.searchForIssuer, 
                                                                }}
                                                            />
                                                        </Form>
                                                        {this.state.issuerKeys && (
                                                            <div style={{ maxWidth: '400px', overflowX: 'auto' }}>
                                                                <List>
                                                                {this.state.issuerKeys.map((key, index) => (
                                                                    <List.Item key={index}>
                                                                        <List.Icon name='key' />
                                                                        <List.Content>{key}</List.Content>
                                                                    </List.Item>
                                                                ))}
                                                                </List>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                </Card>
                                                <Card fluid>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '100%', 
                                                    padding: '20px' 
                                                }}>
                                                    Request Documents for Verification
                                                    <div style={{ width: '80%', marginTop: '20px' }}>
                                                        <Form > {}
                                                            <Input 
                                                                fluid
                                                                placeholder='Input your DID (Verifier)'
                                                                value={this.state.verifierDID} 
                                                                onChange={(e) => this.setState({ verifierDID: e.target.value })}
                                                            />
                                                            <Input 
                                                                fluid
                                                                placeholder='Input the holders DID'
                                                                value={this.state.holderDID} 
                                                                onChange={(e) => this.setState({ holderDID: e.target.value })}
                                                            />
                                                            <Input 
                                                                fluid
                                                                placeholder='What is your request for?'
                                                                value={this.state.request} 
                                                                onChange={(e) => this.setState({ request: e.target.value })}
                                                                action={{
                                                                    content: 'Request',
                                                                    onClick: this.requestCredential, 
                                                                }}
                                                            />
                                                        </Form>
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
                                                    </div>
                                                </div>
                                                </Card>
                                                <Card fluid>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        justifyContent: 'center', 
                                                        alignItems: 'center', 
                                                        height: '100%', 
                                                        padding: '20px' 
                                                    }}>
                                                    Selective Disclosure: Upload a credential, and the chosen attribute to reveal, and download a file for private exchange.
                                                        <div style={{ width: '80%', marginTop: '20px' }}>
                                                            <Form > {}
                                                                <Input 
                                                                    fluid
                                                                    placeholder='What attribute do you want to reveal?'
                                                                    value={this.state.attribute} 
                                                                    onChange={(e) => this.setState({ attribute: e.target.value })}
                                                                />
                                                                <Input 
                                                                    type='file'
                                                                    onChange={this.credentialInput}
                                                                    accept='.json'
                                                                />
                                                            </Form>
                                                            {this.state.credentialFile && (
                                                                <div>
                                                                    <Button color='green' size='mini' onClick={() => this.createFile()}>Retrieve Showcase File</Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                                <Card fluid>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '100%', 
                                                    padding: '20px' 
                                                }}>
                                                    Create a new Consent Log
                                                    <div style={{ width: '80%', marginTop: '20px' }}>
                                                        <Form > {}
                                                            <Input 
                                                                fluid
                                                                placeholder='Your DID'
                                                                value={this.state.logHolderDID} 
                                                                onChange={(e) => this.setState({ logHolderDID: e.target.value })}
                                                            />
                                                            <Input 
                                                                fluid
                                                                placeholder='Verifiers DID'
                                                                value={this.state.logVerifierDID} 
                                                                onChange={(e) => this.setState({ logVerifierDID: e.target.value })}
                                                            />
                                                            <Input 
                                                                fluid
                                                                placeholder='Credential Merkle Tree Root (for on-chain referencing)'
                                                                value={this.state.logCredentialHash} 
                                                                onChange={(e) => this.setState({ logCredentialHash: e.target.value })}
                                                                action={{
                                                                    content: 'Add',
                                                                    onClick: this.logConsent, 
                                                                }}
                                                            />
                                                        </Form>
                                                        
                                                    </div>
                                                </div>
                                                </Card>
                                                <Card fluid>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '100%', 
                                                    padding: '20px' 
                                                }}>
                                                    Revoke an Existing Consent Log
                                                    <div style={{ width: '80%', marginTop: '20px' }}>
                                                        <Form > {}
                                                        <Input 
                                                                fluid
                                                                placeholder='Your DID'
                                                                value={this.state.revokeHolderDID} 
                                                                onChange={(e) => this.setState({ revokeHolderDID: e.target.value })}
                                                            />
                                                            <Input 
                                                                fluid
                                                                placeholder='Verifiers DID'
                                                                value={this.state.revokeVerifierDID} 
                                                                onChange={(e) => this.setState({ revokeVerifierDID: e.target.value })}
                                                            />
                                                            <Input 
                                                                fluid
                                                                placeholder='Credential Merkle Tree Root (for on-chain referencing)'
                                                                value={this.state.revokeCredentialHash} 
                                                                onChange={(e) => this.setState({ revokeCredentialHash: e.target.value })}
                                                                action={{
                                                                    content: 'Revoke',
                                                                    onClick: this.revokeConsent, 
                                                                }}
                                                            />
                                                        </Form>
                                                        {this.state.issuerKeys && (
                                                            <List>
                                                            {this.state.issuerKeys.map((key, index) => (
                                                                <List.Item key={index}>
                                                                    <List.Icon name='key' />
                                                                    <List.Content>{key}</List.Content>
                                                                </List.Item>
                                                            ))}
                                                        </List>
                                                        )}
                                                    </div>
                                                </div>
                                                </Card>
                                                <Card fluid>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '100%', 
                                                    padding: '20px' 
                                                }}>
                                                    Retrieve Your Consent Logs
                                                    <div style={{ width: '80%', marginTop: '20px' }}>
                                                        <Form > {}
                                                            <Input 
                                                                fluid
                                                                placeholder='Input your DID'
                                                                value={this.state.consentHolderDID} 
                                                                onChange={(e) => this.setState({ consentHolderDID: e.target.value })}
                                                                action={{
                                                                    content: 'Retrieve',
                                                                    onClick: this.retrieveConsent, 
                                                                }}
                                                            />
                                                        </Form>
                                                        {this.state.consentLogs && (
                                                            <List>
                                                            {this.state.consentLogs.map((log, index) => (
                                                                <List.Item key={index}>
                                                                    <List.Content>
                                                                        <List.Header>Consent Log {index + 1}</List.Header>
                                                                        <List.Description>
                                                                            <strong>Credential Hash:</strong> {log.credentialHash}<br/>
                                                                            <strong>Verifier DID:</strong> {log.verifierDID}<br/>
                                                                            <strong>Active Consent:</strong> {log.isConsentActive ? 'Yes' : 'No'}<br/>
                                                                            <strong>Timestamp:</strong> {log.timestamp}<br/>
                                                                        </List.Description>
                                                                    </List.Content>
                                                                </List.Item>
                                                            ))}
                                                            </List>
                                                        )}
                                                    </div>
                                                </div>
                                                </Card>
                                            </CardGroup>
                                        </ListItem>
                                    </List>
                                </div>
                            </GridColumn>
                            <GridColumn style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
                                <div style={{ flexGrow: 1 }}>
                                    <List>
                                        <ListItem>
                                            <CardGroup itemsPerRow={1} stackable style={{ height: '100%' }}>
                                                <Card fluid>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center', 
                                                    height: '100%', 
                                                    padding: '20px' 
                                                }}>
                                                    Verification of Credentials. Input Credential Below:
                                                    <div style={{ width: '80%', marginTop: '20px' }}>
                                                        <Form > {}
                                                            <Input 
                                                                fluid
                                                                placeholder='Input the Holders DID'
                                                                value={this.state.setHolderDID} 
                                                                onChange={(e) => this.setState({ setHolderDID: e.target.value })}
                                                            />
                                                            <Input 
                                                                type='file'
                                                                onChange={this.verifiableInput}
                                                                accept='.json'
                                                            />
                                                        </Form>
                                                        {this.state.inputFile && (
                                                            <Button color='green' size='mini' onClick={() => this.verifyCredential()}>Verify Credential</Button>
                                                        )}
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
                                                    </div>
                                                </div>
                                                </Card>
                                                <Card fluid>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        justifyContent: 'center', 
                                                        alignItems: 'center', 
                                                        height: '100%', 
                                                        padding: '20px' 
                                                    }}>
                                                        
                                                        <Header as='h2'>Instructions</Header>
                                                            <List ordered>
                                                                <List.Item>Using the selective disclosure function on the left, you can convert a credential so as to only reveal chosen attributes. You can then use this file on the right
                                                                    where it will verify the Issuer Validity and the inclusion of the attribute within the overal Verifiable Credential.
                                                                </List.Item>
                                                                <List.Item>When credentials are transfered between parties, you can log on-chain the access consents for your credential, and modify 
                                                                    the current status so as to have an immutable log for auditing.
                                                                </List.Item>
                                                                
                                                            </List>

                                                    </div>
                                                </Card>
                                                
                                            </CardGroup>
                                        </ListItem>
                                    </List>
                                </div>
                            </GridColumn>
                            </GridRow>

                        </Grid>
                    </div>
            
        );
    }
}

export default Verification;