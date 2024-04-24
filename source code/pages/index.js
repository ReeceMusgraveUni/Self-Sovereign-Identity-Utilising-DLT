import React, {Component} from 'react';
import registry from '../web3Deployments/registry';
import NavBar from '../pages/navbar';
import Link from 'next/link';
import 'semantic-ui-css/semantic.min.css';
import { Input, Header, Form, Loader, Dimmer, List, Button, Grid } from 'semantic-ui-react';

class Index extends Component {
    
    state = { inputValue: '', document: null, loading: false };
    
    //Retrieves Document from on-chain
    handleSubmit = async () => {
      try{this.setState({ loading: true });
        const document = await registry.methods.readDocument(this.state.inputValue).call();
        /*
        //Testing Purposes
        let gas = 0
        for (let i = 0; i < 100; i++){
            let gasUsed = await registry.methods.readDocument(this.state.inputValue).estimateGas();
            gas += Number(gasUsed);
        }
        console.log("Average Gas Over 100 Iterations: ", (gas/100));
        */
        this.setState({ document, loading: false });
      }catch{
        this.setState({ loading: false });
      }
    }

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
                  <Header size='huge'>Self Sovereign Identity</Header>
                  <div style={inputStyle}>
                    <Form > {}
                      <Input
                        style={{ width: '100%' }}
                        placeholder='Search for DID to retrieve document...'
                        value={this.state.inputValue} 
                        onChange={(e) => this.setState({ inputValue: e.target.value })}
                        action={{
                          icon: 'search',
                          onClick: this.handleSubmit, 
                        }}
                      />
                    </Form>
                  </div>

                  {this.state.loading && (
                    <Dimmer active inverted>
                      <Loader size='large'>Loading</Loader>
                    </Dimmer>
                  )}

                  {this.state.document && (
                    <List celled>
                        <List.Item>
                          <List.Content>
                            <List.Header>Document DID</List.Header>
                              {this.state.document.document[0]}
                            </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Content>
                            <List.Header>Document isActive</List.Header>
                              {this.state.document.document[1] ? 'True' : 'False'}
                            </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Content>
                            <List.Header>metadata</List.Header>
                              {this.state.document.document[2]}
                            </List.Content>
                        </List.Item>
                        <List.Item>
                          <List.Content>
                            <List.Header>Document Owner</List.Header>
                              {this.state.document.document[3]}
                            </List.Content>
                        </List.Item>
                        {this.state.document.methods.map((method, index) => (
                          <List.Item key={index}>
                              <List.Content>
                                <List.Header>Verification Method</List.Header>
                                ID: {method.id}<br/>
                                Type: {method._type}<br/>
                                Controller: {method.controller}<br/>
                                Public Key: {method.publicKey}
                            </List.Content>
                          </List.Item>
                        ))}
                    </List>
                  )}
                  <div>
                    <Link href='/newDID' passHref>
                      <Button 
                        style={{marginTop: '100px'}}
                        as='a'>Create a new Identity Here!
                      </Button>
                    </Link>
                    <Link href='/identity' passHref>
                      <Button 
                        style={{marginTop: '100px'}}
                        as='a'>Identity Management Page
                      </Button>
                    </Link>
                  </div>

                </div>
              </div>
            </Grid.Column>   
        </Grid>
      );
    }  
             
}

export default Index;

