import web3 from '../web3';
import registration from '../deployedArtifacts/registrationContract.json';

const instance = new web3.eth.Contract(
    registration.abi,
    '0xaBc52fB48C36180a65AB87D84B79F9E7C4F840Ab'
);

export default instance;