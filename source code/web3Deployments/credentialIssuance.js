import web3 from '../web3';
import credentialIssuance from '../deployedArtifacts/credentialIssuance.json';

const instance = new web3.eth.Contract(
    credentialIssuance.abi,
    '0x2c3dC5F95469Cd09c0a279eb99439D24B6F88A2A'
);

export default instance;
