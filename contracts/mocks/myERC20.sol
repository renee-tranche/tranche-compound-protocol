// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract myERC20 is Ownable, ERC20 {
    using SafeMath for uint256;

    constructor(uint256 _initialSupply) ERC20("myDai", "MDAI") public {
        _mint(msg.sender, _initialSupply.mul(uint(1e18)));
    }
/*
    function initialize(uint256 _initialSupply) public initializer {
        OwnableUpgradeSafe.__Ownable_init();
        ERC20UpgradeSafe.__ERC20_init_unchained("NewJNT", "NJNT");
        _mint(msg.sender, _initialSupply.mul(uint(1e18)));
    }
*/
}
