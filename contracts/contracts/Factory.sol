// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Factory
 * @dev Factory contract for CREATE2 deployment of MINED Token to specific address
 */
contract Factory {
    
    event ContractDeployed(address indexed contractAddress, bytes32 indexed salt);
    
    /**
     * @dev Deploy a contract using CREATE2
     * @param bytecode The bytecode of the contract to deploy
     * @param salt The salt for CREATE2 deployment
     * @return The address of the deployed contract
     */
    function deploy(bytes memory bytecode, bytes32 salt) public returns (address) {
        address addr;
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(addr != address(0), "Create2: Failed on deploy");
        
        emit ContractDeployed(addr, salt);
        return addr;
    }
    
    /**
     * @dev Calculate the address where a contract will be deployed using CREATE2
     * @param bytecode The bytecode of the contract to deploy
     * @param salt The salt for CREATE2 deployment
     * @return The address where the contract will be deployed
     */
    function computeAddress(bytes memory bytecode, bytes32 salt) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );
        return address(uint160(uint256(hash)));
    }
}
