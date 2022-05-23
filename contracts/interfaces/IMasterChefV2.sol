// SPDX-License-Identifier: MIT
pragma solidity  >=0.4.22 <0.9.0;

interface IMasterChefV2 {
    function stakeLP(uint256 _pid, uint256 _amount) external;

    function withdrawLP(uint256 _pid, uint256 _amount) external;

    function pending(uint256 _pid, address _user) external view returns (uint256);

    function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256);

    function emergencyWithdraw(uint256 _pid) external;
}