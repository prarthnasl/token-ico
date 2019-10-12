var ERC20Token = artifacts.require("./ERC20Token.sol");
var TokenSale = artifacts.require("./TokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(ERC20Token, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(TokenSale, ERC20Token.address, tokenPrice);
  });
};
