import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import { Grid, GridRow, GridColumn, List, ListItem, Card, CardGroup, Form, Input, Loader, Dimmer, Segment, Button, Header, Modal} from 'semantic-ui-react';
import NavBar from '../pages/navbar';
import credentialIssuance from '../web3Deployments/credentialIssuance';
import web3 from '../web3';

class Issuance extends Component {
    state = {search: '', loading: false, schema: '', schemaFile: '', schemaName: '', did: '', requests: '', privateKey: '', credentialFile: '', noRequestFound: false,
showModal: '', modalMessage: ''}
    

    //Retrieve the schema from on-chain
    searchForSchema = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            const schema =  await credentialIssuance.methods.getSchema(this.state.search).call({from: accounts[0]})

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await credentialIssuance.methods.getSchema(this.state.search).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            this.setState({ loading: false, schema: schema});
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong.'});
        }
    };

    //Retrieve Credential Requests from on-chain
    retrieveCredentialRequests = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            let requests =  await credentialIssuance.methods.retrieveCredentialRequest(this.state.did).call({ from: accounts[0]})

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await credentialIssuance.methods.retrieveCredentialRequest(this.state.did).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            console.log(requests)
            this.setState({ loading: false, requests: requests});
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong.',  noRequestFound: true });
        }
    };

    //When a schema is uploaded, we want the input to be read to a state for use later on
    handleSchemaFileChange = (event) => {
        
        //retrieve file and break if no file has been retrieved
        const inputFile = event.target.files[0];
        if (!inputFile) {
            return;
        }
        
        //Use the FileReader API to parse the file into JSON and update the schemaFile state
        const fileReader = new FileReader();
        fileReader.onload = (loadEvent) => {
            try {
                const json = JSON.parse(loadEvent.target.result);
                this.setState({ schemaFile: json });
            } catch (error) {
                console.error('Error has occured', error);
            }
        };
        
        fileReader.readAsText(inputFile);
    };

    //when a credential is uploaded, we want the input to be read to a state for use later on
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

    //This function attempts to upload the schema to on-chain storage, including a loading screen during processing
    uploadSchema = async () => {
        try {
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            await credentialIssuance.methods.addSchema(this.state.schemaName, JSON.stringify(this.state.schemaFile)).send({ from: accounts[0]});

            /*
            //Testing Purposes
            let gas = 0
            for (let i = 0; i < 100; i++){
                let gasUsed = await credentialIssuance.methods.addSchema(this.state.schemaName + i.toString(), JSON.stringify(this.state.schemaFile)).estimateGas({ from: accounts[0] });
                gas += Number(gasUsed);
            }
            console.log("Average Gas Over 100 Iterations: ", (gas/100));
            */

            this.setState({ loading: false});
        }catch(error){
            console.error('Error has occured', error)
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong.'});
        }  
    };

    //This function will allows the Verifiable Credential to be downloaded by the Holder
    generateAndDownloadJSON = (data) => {
        
        //Format file for download
        const fileData = JSON.stringify(data, null, 2);
        const blob = new Blob([fileData], { type: 'application/json' });
    
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'verifiableCredential.json';
        link.href = url;
        
        //Automatically Download
        link.click();
    
        URL.revokeObjectURL(url);
    };

    //Creates a Verifiable Credential which can be downloaded
    createCredential = async () => {
        try{
            
            this.setState({ loading: true });
            const accounts = await web3.eth.getAccounts();
            const { credentialFile, privateKey } = this.state;

            //Utilise Off-chain function for generating a Merkle Tree from the filled out schema
            try{
                const response = await fetch('http://localhost:3001/api/createMerkleTree', {
                    method: 'POST',
                    headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({credentialFile})
                
                });
                if (!response.ok) {
                    throw new Error(`Error has occured: ${response.status}`);
                }
                
                //Merkle Tree Components
                const responseData = await response.json();
                
                //Sign Merkle Tree using off-chain function (uses private key to sign the merkle tree root)
                const signatureResponse = await fetch('http://localhost:3001/api/createSignature', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: responseData.root, 
                        privateKey: privateKey 
                    })
                });
        
                if (!signatureResponse.ok) {
                    throw new Error(`Error has occured: ${signatureResponse.status}`);
                }
                const signatureData = await signatureResponse.json();
                
                /*
                //Testing Purposes
                let gas = 0
                for (let i = 0; i < 100; i++){
                    let gasUsed = await credentialIssuance.methods.issueCredential(credentialFile.id, responseData.root, credentialFile.validTill).estimateGas({ from: accounts[0] });
                    gas += Number(gasUsed);
                }
                console.log("Average Gas Over 100 Iterations: ", (gas/100));
                */
               
                //Publish Record & Root on Chain
                try{
                    await credentialIssuance.methods.issueCredential(credentialFile.id, responseData.root, credentialFile.validTill).send({from: accounts[0]});
                }catch{throw new Error(`Error has occured when publishing the references on-chain`);}
                
                //Download Verifiable Credential to be tranfered off-chain
                const dataToDownload = {
                    signature: signatureData,
                    root: responseData.root,
                    tree: responseData.tree,
                    output: responseData.output,
                    values: credentialFile
                };
                this.generateAndDownloadJSON(dataToDownload);
                
            }catch(error){
                console.log('Failure making Merkle Tree', error)
            }
            
            this.setState({ loading: false});
        }catch(error) {
            console.error('Credential Not Created', error);
            this.setState({ loading: false, showModal: true, modalMessage: 'Something went wrong.'});
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
                <Grid columns={3} divided style={{ height: '100%'}}>
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
                    <GridRow style={{ height: '100%' }}>
                        <GridColumn style={{ display: 'flex', flexDirection: 'column', height: '100%' }} >
                            <div style={{ flexGrow: 1 }}>
                                <List>
                                    <ListItem>
                                    <CardGroup itemsPerRow={1} stackable style={{ height: '100%' }}>
                                            <Card fluid>
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '30px'}}>
                                                Schema Finder Function
                                                <div style={{ width: '80%', marginTop: '20px' }}>
                                                    <Form > {}
                                                        <Input 
                                                            fluid
                                                            placeholder='Search For a Specific Schema'
                                                            value={this.state.search} 
                                                            onChange={(e) => this.setState({ search: e.target.value })}
                                                            action={{
                                                                content: 'Search',
                                                                onClick: this.searchForSchema, 
                                                            }}
                                                        />
                                                    </Form>
                                                    {this.state.schema && (
                                                        <Segment style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto', overflowWrap: 'break-word' }}>
                                                            {Object.entries(JSON.parse(this.state.schema)).map(([key, value]) => (
                                                                <div key={key}> {}
                                                                    <strong>{key}:</strong> 
                                                                    {typeof value === 'object' && value !== null ? (
                                                                        <div style={{ marginLeft: '20px' }}> {}
                                                                            {Object.entries(value).map(([innerKey, innerValue]) => (
                                                                                <div key={innerKey}>
                                                                                    {innerKey}: {JSON.stringify(innerValue, null, 2)}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        value.toString()
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </Segment>
                                                    )}
                                                </div>
                                            </div>
                                            </Card>
                                            <Card fluid>
                                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '30px'}}>
                                                    Schema Uploader Function
                                                    <Form style = {{marginTop: '20px'}}>
                                                        <Input 
                                                            fluid
                                                            placeholder='Name of Schema'
                                                            value={this.state.schemaName} 
                                                            onChange={(e) => this.setState({ schemaName: e.target.value })}
                                                        />
                                                        <Input 
                                                            type='file'
                                                            onChange={this.handleSchemaFileChange}
                                                            accept='.json'
                                                        />
                                                        {this.state.schemaFile && (
                                                            <div>
                                                                <Segment style ={{ overflowY: 'auto', overflowWrap: 'break-word'}}>
                                                                    <pre>{JSON.stringify(this.state.schemaFile, null, 2)}</pre>
                                                                </Segment>
                                                                <Button icon='save' color='green' size='mini' onClick={() => this.uploadSchema()}></Button>
                                                                
                                                            </div>
                                                        )}
                                                        
                                                    </Form>
                                                </div>
                                            </Card>
                                            <Card fluid>
                                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '30px'}}>
                                                    View Credential Requests
                                                    <div style={{ width: '80%', marginTop: '20px' }}>
                                                        <Form > {}
                                                            <Input 
                                                                fluid
                                                                placeholder='Input Your DID'
                                                                value={this.state.did} 
                                                                onChange={(e) => this.setState({ did: e.target.value })}
                                                                action={{
                                                                    content: 'Search',
                                                                    onClick: this.retrieveCredentialRequests, 
                                                                }}
                                                            />
                                                        </Form>
                                                        {this.state.requests &&  ( 
                                                            <List celled>
                                                                {this.state.requests.map((method, index) => (
                                                                    <List.Item key={index}>
                                                                    <List.Content>
                                                                        <List.Header>Request for Credential</List.Header>
                                                                            Holder: {method.holderDID}<br/>
                                                                            Schema: {method.schemaId}<br/>
                                                                            Active Request: {method.isActive ? 'True' : 'False'}
                                                                    </List.Content>
                                                                    </List.Item>
                                                                ))}
                                                            </List>
                                                        )}
                                                        {this.state.noRequestFound && (
                                                            <div>NO REQUESTS FOUND</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </CardGroup>
                                    </ListItem>
                                </List>
                            </div>
                        </GridColumn>
                        <GridColumn>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '30px'}}>
                                <Header as='h2'>Instructions</Header>
                                <List ordered>
                                    <List.Item>If you know the name of a specific schema, you can search for it and view it with the Schema Finder Function.</List.Item>
                                    <List.Item>If you want to upload a new schema for future use and reference, you can do this with the Schema Uploader Function.</List.Item>
                                    <List.Item>View Credential Requests will allows you to see if entity has requested a Verifiable Credential from you.</List.Item>
                                    <List.Item>To produce a verifiable credential, simply insert your private key and upload your filled out schema. Once this is done 
                                               a new button will appear to confirm. After the loading phase, an automatic download will begin of the Verifiable Credential allowing you to exchange this off-chain.
                                    </List.Item>
                                </List>
                                <Header as='h3' style={{ marginTop: '20px' }}>TEMPLATE SCHEMA</Header>
                                <Header as='h5' style={{ marginTop: '2px' }}>Expand with new credentialSubjects as required.</Header>
                                    <Segment style={{ overflowX: 'auto', width: '100%', whiteSpace: 'pre-wrap' }}>
                                        <pre style={{ margin: '0'}}>{`
                                        {
                                            'id': 'Credential ID',
                                            'issuer': 'Issuers DID',
                                            'validFrom': 'Date of Credential Issuance, UNIX TIMESTAMP',
                                            'validTill': 'Validity Period, left blank if no end date, UNIX TIMESTAMP',
                                            'signature': 'digitally sign credential',
                                            'type': ['Type of Credential'],
                                            'credentialSubject': {
                                                'id': 'DID of Subject',
                                                'name': '',
                                                'age': '',
                                                'memberOfClub': false
                                            }
                                        }`}</pre>
                                    </Segment>
                            </div>
                            
                        </GridColumn>
                        <GridColumn>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '30px'}}>
                                    Produce a Verifiable Credential
                                        <div style={{ width: '80%', marginTop: '20px' }}>
                                            <Form > {}
                                                <Input 
                                                    fluid
                                                    placeholder='Input Your Private Key'
                                                    value={this.state.privateKey} 
                                                    onChange={(e) => this.setState({ privateKey: e.target.value })}
                                                    
                                                />
                                                <Input 
                                                    type='file'
                                                    onChange={this.credentialInput}
                                                    accept='.json'
                                                />
                                                {this.state.credentialFile && (
                                                    <div>
                                                        <Segment style ={{ overflowY: 'auto', overflowWrap: 'break-word'}}>
                                                            <pre>{JSON.stringify(this.state.credentialFile, null, 2)}</pre>
                                                        </Segment>
                                                        <Button color='green' size='mini' onClick={() => this.createCredential()}>Create Credential</Button>
                                                        
                                                    </div>
                                                )}
                                            </Form>
                                        </div>
                            </div>
                        </GridColumn>
                    </GridRow>
                </Grid>
            </div>
        );
    }
}

export default Issuance;