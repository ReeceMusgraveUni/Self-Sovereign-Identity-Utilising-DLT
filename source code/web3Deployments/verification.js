import web3 from '../web3';
import verification from '../deployedArtifacts/verification.json';

const instance = new web3.eth.Contract(
    verification.abi,
    '0xfF5E0789333002c7E592B3831fC36E0474AC8174'
);

export default instance;