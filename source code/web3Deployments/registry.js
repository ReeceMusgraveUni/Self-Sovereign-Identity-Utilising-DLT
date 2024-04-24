import web3 from '../web3';
import registry from '../deployedArtifacts/registryContract.json';

const instance = new web3.eth.Contract(
    registry.abi,
    '0x49a3Ff0ADCA47a17c1a68127Af8356901aDDc9Bb'
);

export default instance;