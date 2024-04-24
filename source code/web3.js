import Web3 from "web3";
 
let web3;
 
if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  window.ethereum.request({ method: "eth_requestAccounts" });
  web3 = new Web3(window.ethereum);
} else {
  const provider = new Web3.providers.HttpProvider(
    "https://sepolia.infura.io/v3/85db62b8355a4ee3a5682b73732c60d2"
  );
  web3 = new Web3(provider);
}
 
export default web3;