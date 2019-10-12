var ERC20Token = artifacts.require('./ERC20Token.sol');
var TokenSale = artifacts.require('./TokenSale.sol');

contract('TokenSale', function(accounts) {
  var tokenInstance;
  var tokenSaleInstance;
  var manager = accounts[0];
  var buyer = accounts[1];
  var tokenPrice = 1000000000000000; // in wei
  var tokensAvailable = 500000;
  var numberOfTokens;

  it('initializes the contract with the correct values', function() {
    return TokenSale.deployed().then(function(instance) {
      tokenSaleInstance = instance;
      return tokenSaleInstance.address;
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has contract address');
      return tokenSaleInstance.tokenContract();
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has token contract address');
      return tokenSaleInstance.tokenPrice();
    }).then(function(price) {
      assert.equal(price, tokenPrice, 'token price is correct');
    });
  });

  it('facilitates token buying', function() {
    return ERC20Token.deployed().then(function(instance) {
      // Grab token instance first
      tokenInstance = instance;
      return TokenSale.deployed();
    }).then(function(instance) {
      // Then grab token sale instance
      tokenSaleInstance = instance;
      // Provision 50% of all tokens to the token sale
      return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: manager })
    }).then(function(receipt) {
      numberOfTokens = 10;
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice })
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
      assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
      assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
      return tokenSaleInstance.tokensSold();
    }).then(function(amount) {
      assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
      return tokenInstance.balanceOf(buyer);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), numberOfTokens);
      return tokenInstance.balanceOf(tokenSaleInstance.address);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
      // Try to buy tokens different from the ether value
      return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
      return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
    });
  });

  it('ends token sale', function() {
    return ERC20Token.deployed().then(function(instance) {
      // Grab token instance first
      tokenInstance = instance;
      return TokenSale.deployed();
    }).then(function(instance) {
      // Then grab token sale instance
      tokenSaleInstance = instance;
      // Try to end sale from account other than the manager
      return tokenSaleInstance.endSale({ from: buyer });
    }).then(assert.fail).catch(function(error) {
      assert(error.message, 'Should not be able to purchase more tokens than available');
      // End sale as manager
      return tokenSaleInstance.endSale({ from: manager });
    }).then(function(receipt) {
      return tokenInstance.balanceOf(manager);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 999990, 'returns all unsold tokens to the manager');
      // Check that the contract has no balance
      return web3.eth.getBalance(tokenSaleInstance.address);
    }).then(function(balance){
      assert.equal(balance, 0);
    });
  });
});
