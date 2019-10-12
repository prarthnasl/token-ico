pragma solidity ^0.5.8;

import "./ERC20Token.sol";

contract TokenSale {
    address payable manager;
    ERC20Token public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer, uint256 _amount);
    event EndSale(uint256 _totalAmountSold);

    constructor(ERC20Token _tokenContract, uint256 _tokenPrice) public {
        manager = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x);
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        require(msg.value == multiply(_numberOfTokens, tokenPrice));
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens); // Contract should have requested number of tokens
        require(tokenContract.transfer(msg.sender, _numberOfTokens));

        tokensSold += _numberOfTokens;

        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == manager);
        require(tokenContract.transfer(manager, tokenContract.balanceOf(address(this))));

        // Transfering the balance to the manager before ending sale
        manager.transfer(address(this).balance);
         emit EndSale(tokensSold);
        /* selfdestruct(manager); */
    }
}
