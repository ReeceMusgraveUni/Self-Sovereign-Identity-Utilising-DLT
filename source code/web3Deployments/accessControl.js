import web3 from '../web3';
import accessControl from '../deployedArtifacts/accessControl.json';

const instance = new web3.eth.Contract(
    accessControl.abi,
    '0x4ee3aBa2eaa0BA397802e184fDbb60Fc72139d99'
);

export default instance;