// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IBoostContract {
    function onCakePoolUpdate(
        address _user,
        uint256 _lockedAmount,
        uint256 _lockedDuration,
        uint256 _totalLockedAmount,
        uint256 _maxLockDuration
    ) external;
}