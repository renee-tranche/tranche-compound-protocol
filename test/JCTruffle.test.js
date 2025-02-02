const {
  deployProxy,
  upgradeProxy
} = require('@openzeppelin/truffle-upgrades');
const {
  expect
} = require('chai');

const Web3 = require('web3');
// Ganache UI on 8545
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const {
  BN,
  constants,
  expectEvent,
  expectRevert,
  time
} = require('@openzeppelin/test-helpers');

const myERC20 = artifacts.require("myERC20");
const CEther = artifacts.require("CEther");
const CErc20 = artifacts.require("CErc20");
const JAdminTools = artifacts.require('JAdminTools');
const JFeesCollector = artifacts.require('JFeesCollector');

const JCompound = artifacts.require('JCompound');
const JCompoundHelper = artifacts.require('JCompoundHelper');
const JTranchesDeployer = artifacts.require('JTranchesDeployer');

const JTrancheAToken = artifacts.require('JTrancheAToken');
const JTrancheBToken = artifacts.require('JTrancheBToken');

const MYERC20_TOKEN_SUPPLY = 5000000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

let daiContract, cEtherContract, cERC20Contract, jFCContract, jATContract, jTrDeplContract, jCompContract;
let ethTrAContract, ethTrBContract, daiTrAContract, daiTrBContract;
let tokenOwner, user1;

contract("JCompound", function (accounts) {

  it("ETH balances", async function () {
    //accounts = await web3.eth.getAccounts();
    tokenOwner = accounts[0];
    user1 = accounts[1];
    console.log(tokenOwner);
    console.log(await web3.eth.getBalance(tokenOwner));
    console.log(await web3.eth.getBalance(user1));
  });

  it("DAI total Supply", async function () {
    daiContract = await myERC20.deployed();
    result = await daiContract.totalSupply();
    expect(web3.utils.fromWei(result.toString(), "ether")).to.be.equal(MYERC20_TOKEN_SUPPLY.toString());
  });

  it("Mockups ok", async function () {
    cEtherContract = await CEther.deployed();
    expect(cEtherContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(cEtherContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(cEtherContract.address);
    cERC20Contract = await CErc20.deployed();
    expect(cERC20Contract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(cERC20Contract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(cERC20Contract.address);
    tx = await cERC20Contract.setToken(daiContract.address); // just for mockup!!!
  });

  it("All other contracts ok", async function () {
    jFCContract = await JFeesCollector.deployed();
    expect(jFCContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jFCContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jFCContract.address);

    jATContract = await JAdminTools.deployed();
    expect(jATContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jATContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jATContract.address);

    jTrDeplContract = await JTranchesDeployer.deployed();
    expect(jTrDeplContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jTrDeplContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jTrDeplContract.address);

    jCompContract = await JCompound.deployed();
    expect(jCompContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jCompContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jCompContract.address);
    // await jCompContract.setRedemptionTimeout(0, {
    //   from: accounts[0]
    // });

    jCompHelperContract = await JCompoundHelper.deployed();
    expect(jCompHelperContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jCompHelperContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jCompHelperContract.address);

    trParams0 = await jCompContract.trancheAddresses(0);
    ethTrAContract = await JTrancheAToken.at(trParams0.ATrancheAddress);
    expect(ethTrAContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethTrAContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethTrAContract.address);

    ethTrBContract = await JTrancheBToken.at(trParams0.BTrancheAddress);
    expect(ethTrBContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethTrBContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethTrBContract.address);

    trParams1 = await jCompContract.trancheAddresses(1);
    daiTrAContract = await JTrancheAToken.at(trParams1.ATrancheAddress);
    expect(daiTrAContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(daiTrAContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(daiTrAContract.address);

    daiTrBContract = await JTrancheBToken.at(trParams1.BTrancheAddress);
    expect(daiTrBContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(daiTrBContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(daiTrBContract.address);
  });

  it('send some ETH to CEther', async function () {
    tx = await web3.eth.sendTransaction({
      to: cEtherContract.address,
      from: tokenOwner,
      value: web3.utils.toWei('10', 'ether')
    });
    protBal = await web3.eth.getBalance(cEtherContract.address);
    console.log(`CEther ETH Balance: ${web3.utils.fromWei(protBal, "ether")} ETH`)
    console.log(`tokenOwner Balance: ${await cEtherContract.balanceOf(tokenOwner)} cETH`)
    console.log(`CEther supply Balance: ${await cEtherContract.totalSupply()} cETH`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(10).toString());
  });

  it('send some DAI to CErc20', async function () {
    tx = await daiContract.transfer(cERC20Contract.address, web3.utils.toWei('1000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to JCompound: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await daiContract.balanceOf(cERC20Contract.address);
    console.log(`protocol DAI Balance: ${web3.utils.fromWei(protBal, "ether")} DAI`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(1000).toString());
  });

  it('send some DAI to user1', async function () {
    tx = await daiContract.transfer(user1, web3.utils.toWei('100000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to user1: " + tx.receipt.gasUsed);
    userBal = await daiContract.balanceOf(user1);
    console.log(`user1 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(100000).toString());
  });

  it("user1 buys some token EthTrA", async function () {
    console.log(user1);
    console.log("User1 Eth balance: " + web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    trAddresses = await jCompContract.trancheAddresses(0); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(0);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    trPar = await jCompContract.trancheParameters(0);
    console.log("param tranche A: " + JSON.stringify(trPar));
    console.log("rpb tranche A: " + trPar[3].toString());
    tx = await jCompContract.calcRPBFromPercentage(0, {
      from: user1
    });
    trPar = await jCompContract.trancheParameters(0);
    console.log("rpb tranche A: " + trPar[3].toString());
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));
    trPar = await jCompContract.trancheParameters(0);
    console.log("param tranche A: " + JSON.stringify(trPar));
    tx = await jCompContract.buyTrancheAToken(0,  web3.utils.toWei("1", "ether"), {
      from: user1,
      value: web3.utils.toWei("1", "ether")
    });
    console.log("User1 New Eth balance: " + web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: " + web3.utils.fromWei(await ethTrAContract.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));
    trAddresses = await jCompContract.trancheAddresses(0); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(0);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));

    console.log("staker counter trA: " + (await jCompContract.stakeCounterTrA(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheA(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it("user1 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    tx = await jCompContract.buyTrancheBToken(0, web3.utils.toWei("1", "ether"), {
      from: user1,
      value: web3.utils.toWei("1", "ether")
    });
    console.log("User1 New Eth balance: " + web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trB tokens: " + web3.utils.fromWei(await ethTrBContract.balanceOf(user1), "ether") + " ETB");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(0, 0), "ether"));

    console.log("staker counter trB: " + (await jCompContract.stakeCounterTrB(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheB(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it("user1 buys some token daiTrA", async function () {
    console.log("is Dai allowed in JCompound: " + await jCompContract.isCTokenAllowed(daiContract.address));
    
    trAddresses = await jCompContract.trancheAddresses(1); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(1);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    console.log("param tranche A: " + JSON.stringify(trPars));
    console.log("rpb tranche A: " + trPar[3].toString());
    tx = await jCompContract.calcRPBFromPercentage(1, {
      from: user1
    });
    trPar = await jCompContract.trancheParameters(1);
    console.log("rpb tranche A: " + trPar[3].toString());
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));
    trPars = await jCompContract.trancheParameters(1);
    console.log("param tranche A: " + JSON.stringify(trPars));
    trParams = await jCompContract.trancheAddresses(1);
    expect(trParams.buyerCoinAddress).to.be.equal(daiContract.address);
    expect(trParams.cTokenAddress).to.be.equal(cERC20Contract.address);
    console.log("User1 DAI balance: " + web3.utils.fromWei(await daiContract.balanceOf(user1), "ether") + " DAI");
    tx = await daiContract.approve(jCompContract.address, web3.utils.toWei("10000", "ether"), {
      from: user1
    });
    tx = await jCompContract.buyTrancheAToken(1, web3.utils.toWei("10000", "ether"), {
      from: user1
    });
    console.log("User1 New DAI balance: " + web3.utils.fromWei(await daiContract.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trA tokens: " + web3.utils.fromWei(await daiTrAContract.balanceOf(user1), "ether") + " DTA");
    console.log("CErc20 DAI balance: " + web3.utils.fromWei(await daiContract.balanceOf(cERC20Contract.address), "ether") + " DAI");
    console.log("JCompound DAI balance: " + web3.utils.fromWei(await daiContract.balanceOf(jCompContract.address), "ether") + " DAI");
    console.log("JCompound cDAI balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cERC20Contract.address), "ether") + " cDai");
    trPar = await jCompContract.trancheParameters(1);
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));
    trAddresses = await jCompContract.trancheAddresses(1); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(1);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    console.log("Compound TrA Value: " + web3.utils.fromWei(await jCompContract.getTrAValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await jCompContract.getTotalValue(1), "ether"));

    console.log("staker counter trA: " + (await jCompContract.stakeCounterTrA(user1, 1)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheA(user1, 1, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it("user1 buys some token daiTrB", async function () {
    console.log("User1 DAI balance: " + web3.utils.fromWei(await daiContract.balanceOf(user1), "ether") + " DAI");
    trAddr = await jCompContract.trancheAddresses(1);
    buyAddr = trAddr.buyerCoinAddress;
    console.log("Tranche Buyer Coin address: " + buyAddr);
    console.log("TrB value: " + web3.utils.fromWei(await jCompContract.getTrBValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await jCompContract.getTotalValue(1), "ether"));
    console.log("TrB total supply: " + web3.utils.fromWei(await daiTrBContract.totalSupply(), "ether"));
    console.log("Compound TrA Value: " + web3.utils.fromWei(await jCompContract.getTrAValue(1), "ether"));
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(1, web3.utils.toWei("10000", "ether")), "ether"));
    tx = await daiContract.approve(jCompContract.address, web3.utils.toWei("10000", "ether"), {
      from: user1
    });
    tx = await jCompContract.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {
      from: user1
    });
    console.log("User1 New DAI balance: " + web3.utils.fromWei(await daiContract.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trB tokens: " + web3.utils.fromWei(await daiTrBContract.balanceOf(user1), "ether") + " DTB");
    console.log("CErc20 DAI balance: " + web3.utils.fromWei(await daiContract.balanceOf(cERC20Contract.address), "ether") + " DAI");
    console.log("JCompound DAI balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cERC20Contract.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(1, 0), "ether"));
    trAddresses = await jCompContract.trancheAddresses(1); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(1);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    trPar = await jCompContract.trancheParameters(1);
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));
    console.log("Compound TrA Value: " + web3.utils.fromWei(await jCompContract.getTrAValue(1), "ether"));
    console.log("TrB value: " + web3.utils.fromWei(await jCompContract.getTrBValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await jCompContract.getTotalValue(1), "ether"));

    console.log("staker counter trA: " + (await jCompContract.stakeCounterTrB(user1, 1)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheB(user1, 1, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);

    await cEtherContract.setExchangeRateStored(new BN("27061667570282877")); //27061567570282877
    console.log("Compound New price: " + await cEtherContract.exchangeRateStored());
    await cERC20Contract.setExchangeRateStored(new BN("21062567570282878")); //21061567570282878
    console.log("Compound New price: " + await cEtherContract.exchangeRateStored());
  });

  it("user1 redeems token EthTrA", async function () {
    oldBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: " + web3.utils.fromWei(bal, "ether") + " ETA");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("CEther eth bal:" + web3.utils.fromWei(await web3.eth.getBalance(cEtherContract.address)), "ether");
    trPar = await jCompContract.trancheParameters(0);
    stPrice = trPar.storedTrancheAPrice * Math.pow(10, -18);
    //console.log(stPrice.toString());
    tempAmnt = bal * Math.pow(10, -18);
    //console.log(tempAmnt.toString())
    taAmount = tempAmnt * stPrice;
    console.log(taAmount);
    tx = await ethTrAContract.approve(jCompContract.address, bal, {
      from: user1
    });
    await jCompContract.redeemTrancheAToken(0, bal, {
      from: user1
    });
    newBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trA interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trA tokens: " + web3.utils.fromWei(await ethTrAContract.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound new cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));

    console.log("staker counter trA: " + (await jCompContract.stakeCounterTrA(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheA(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it('let timeout elapsed', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 5;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
  });

  it("user1 redeems token daiTrA", async function () {
    oldBal = web3.utils.fromWei(await daiContract.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await daiTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await jCompContract.getTokenBalance(cERC20Contract.address), "ether") + " cDai");
    tx = await daiTrAContract.approve(jCompContract.address, bal, {from: user1});
    trPar = await jCompContract.trancheParameters(1);
    console.log("TrA price: " + web3.utils.fromWei(trPar[2].toString()));
    tx = await jCompContract.redeemTrancheAToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await daiContract.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await daiTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("User1 trA interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await daiContract.balanceOf(cERC20Contract.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await jCompContract.getTokenBalance(cERC20Contract.address), "ether") + " cDai");
    console.log("Compound TrA Value: " + web3.utils.fromWei(await jCompContract.getTrAValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await jCompContract.getTotalValue(1), "ether"));

    console.log("staker counter trA: " + (await jCompContract.stakeCounterTrA(user1, 1)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheA(user1, 1, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString())
  }); 

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
    await cEtherContract.setExchangeRateStored(new BN("27061767570282877")); //27061667570282877
    console.log("Compound New price: " + await cEtherContract.exchangeRateStored());
    await cERC20Contract.setExchangeRateStored(new BN("21063567570282878")); //21062567570282878
    console.log("Compound New price: " + await cEtherContract.exchangeRateStored());
  });

  it("user1 redeems token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: " + web3.utils.fromWei(bal, "ether") + " ETB");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(0, 0), "ether"));
    tx = await ethTrBContract.approve(jCompContract.address, bal, {
      from: user1
    });
    await jCompContract.redeemTrancheBToken(0, bal, {
      from: user1
    });
    newBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trB interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trB tokens: " + web3.utils.fromWei(await ethTrAContract.balanceOf(user1), "ether") + " ETB");
    console.log("JCompound new cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(0, 0), "ether"));

    console.log("staker counter trB: " + (await jCompContract.stakeCounterTrB(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheB(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it('let timeout elapsed', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 5;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
  });
  
  it("user1 redeems token daiTrB", async function () {
    oldBal = web3.utils.fromWei(await daiContract.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await daiTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await jCompContract.getTokenBalance(cERC20Contract.address), "ether") + " cDai");
    tx = await daiTrBContract.approve(jCompContract.address, bal, {from: user1});
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(1, 0), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await jCompContract.getTrBValue(1), "ether"));
    tx = await jCompContract.redeemTrancheBToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await daiContract.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await daiTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User1 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await daiContract.balanceOf(cERC20Contract.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await jCompContract.getTokenBalance(cERC20Contract.address), "ether") + " cDai");
    console.log("TrA Value: " + web3.utils.fromWei(await jCompContract.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await jCompContract.getTrBValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await jCompContract.getTotalValue(1), "ether"));

    console.log("staker counter trB: " + (await jCompContract.stakeCounterTrB(user1, 1)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheB(user1, 1, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  }); 

});