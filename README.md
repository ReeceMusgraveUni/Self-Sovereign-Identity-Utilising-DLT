# Self-Sovereign Identity Utilising DLT

## Project Overview

This repository contains the implementation of a Self-Sovereign Identity (SSI) system leveraging Distributed Ledger Technology (DLT), as described in our research paper "Self-Sovereign Identity: A Pathway to Inclusion through Distributed Ledger Technology". Our system aims to provide a secure, privacy-preserving, and user-centric approach to digital identity management.

## Key Features

- **Decentralized Identity Management**: Utilizes blockchain technology to eliminate single points of failure and enhance data integrity.
- **Quantum-Resistant Cryptography**: Implements post-quantum cryptographic algorithms to future-proof the system against potential quantum computing threats.
- **Selective Disclosure**: Uses Merkle trees to allow users to share only specific pieces of information without revealing their entire credential.
- **Community Voting Mechanism**: Facilitates peer validation of identities, fostering greater trust and transparency within the system.
- **Smart Contract Implementation**: Includes contracts for identity registration, credential issuance, verification, access control, and community voting.

## Repository Structure

- `/contracts`: Solidity smart contracts for the SSI system
  - `AccessControl.sol`: Manages access permissions for identity data
  - `CommunityVoting.sol`: Implements the decentralized voting mechanism
  - `CredentialIssuance.sol`: Handles the issuance of verifiable credentials
  - `IdentityRegistry.sol`: Manages the registry of digital identities
  - `Registration.sol`: Handles the registration of new identities
  - `Verification.sol`: Manages the verification of credentials
- `/migrations`: Truffle migration scripts
- `/test`: Test files for smart contracts
- `truffle-config.js`: Truffle configuration file

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- Truffle Suite
- Ganache (for local blockchain testing)
- MetaMask (for interacting with the Ethereum blockchain)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/ReeceMusgraveUni/Self-Sovereign-Identity-Utilising-DLT.git
   ```

2. Install dependencies:
   ```
   cd Self-Sovereign-Identity-Utilising-DLT
   npm install
   ```

3. Compile and migrate smart contracts:
   ```
   truffle compile
   truffle migrate
   ```

4. Run tests:
   ```
   truffle test
   ```

## Usage

Detailed usage instructions for interacting with the smart contracts can be found in the individual contract files in the `/contracts` directory.

## Contributing

We welcome contributions to this project. Please feel free to submit pull requests or open issues to discuss potential improvements or report bugs.

## License

This project is open source. Please ensure you understand and comply with the licensing terms before using or contributing to this project.

## Acknowledgments

- This project is based on research conducted at the University of Aberdeen, United Kingdom.
- We thank the Ethereum community for their invaluable resources and documentation.


## Contact

For any queries regarding this project, please open an issue on GitHub or contact the maintainers directly through their GitHub profiles.
