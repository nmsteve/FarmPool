// SPDX-License-Identifier: MIT
pragma solidity  >=0.4.22 <0.9.0;

interface IVCake {

    function deposit(
        address _user,
        uint256 _amount,
        uint256 _lockDuration
    ) external;

    function withdraw(address _user) external;
    
}