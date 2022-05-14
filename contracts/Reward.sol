// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// mock class using ERC20
contract Reward is ERC20 {
    constructor (
        string memory name,
        string memory symbol,        
        uint256 initialsupply
    )  payable ERC20(name, symbol) {
         decimals();
        _mint(msg.sender, initialsupply);
    }

    function transferInternal(address from, address to, uint256 value) public {
        _transfer(from, to, value);
    }

    function approveInternal(address owner, address spender, uint256 value) public {
        _approve(owner, spender, value);
    }
}
