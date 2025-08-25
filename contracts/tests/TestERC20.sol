// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract TestERC20 is ERC20Permit {
    uint8 public tokenDecimals;
    constructor(uint256 amountToMint, uint8 _tokenDecimals) ERC20("Test ERC20", "TEST") ERC20Permit("Test ERC20") {
        tokenDecimals = _tokenDecimals;
        _mint(msg.sender, amountToMint);
    }

    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}
