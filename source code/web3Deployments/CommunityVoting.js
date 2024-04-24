import web3 from '../web3';
import CommunityVoting from '../deployedArtifacts/CommunityVoting.json';

const instance = new web3.eth.Contract(
    CommunityVoting.abi,
    '0x5Be47FB2421ceB8FD7D95C2eb92a96dd80c9a4A7'
);

export default instance;