const {
    deployProxy,
    upgradeProxy
} = require('@openzeppelin/truffle-upgrades');
const {
    accounts,
    contract,
    web3
} = require('@openzeppelin/test-environment');
const {
    BN,
    constants,
    expectEvent,
    expectRevert
} = require('@openzeppelin/test-helpers');
const {
    expect
} = require('chai');
const {
    ZERO_ADDRESS
} = constants;

const FAKE_ADDRESS = "0xc81f5980EA3ABFfe06A3cedB3A68db07469B9390";

const myERC20 = contract.fromArtifact("myERC20");
const CEther = contract.fromArtifact("CEther");
const CErc20 = contract.fromArtifact("CErc20");
const JPriceOracle = contract.fromArtifact('JPriceOracle');
const JFeesCollector = contract.fromArtifact('JFeesCollector');

const JCompound = contract.fromArtifact('JCompound');
const JTranchesDeployer = contract.fromArtifact('JTranchesDeployer');

const MYERC20_TOKEN_SUPPLY = 5000000;
const GAS_PRICE = 27000000000;


function deployMinimumFactory (tokenOwner, factoryOwner, factoryAdmin) {

  it('deploys DAI mockup', async function () {
    //gasPrice = await web3.eth.getGasPrice();
    //console.log("Gas price: " + gasPrice);
    console.log("TokenOwner address: " + tokenOwner);
    this.DAI = await myERC20.new({ from: tokenOwner });
    expect(this.DAI.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.DAI.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`Coll Token Address: ${this.DAI.address}`);
    result = await this.DAI.totalSupply();
    expect(result.toString()).to.be.equal(new BN(0).toString());
    console.log("DAI total supply: " + result);
    tx = await web3.eth.getTransactionReceipt(this.DAI.transactionHash);
    console.log("DAI contract deploy Gas: " + tx.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ERC20 Coll1 deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.DAI.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    tx = await this.DAI.initialize(MYERC20_TOKEN_SUPPLY, { from: tokenOwner });
    console.log("DAI contract Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("ERC20 Coll1 Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.DAI.owner();
    expect(result).to.be.equal(tokenOwner);
    console.log("DAI owner address: " + result);
    borrBal = await this.DAI.balanceOf(tokenOwner);
    console.log(`tokenOwner Balance: ${web3.utils.fromWei(borrBal, "ether")} DAI`);
  });  

  it('deploys JFeeCollector', async function () {
    console.log("factoryOwner address: " + factoryOwner);
    this.JFeesCollector = await JFeesCollector.new({ from: factoryOwner })
    tx = await web3.eth.getTransactionReceipt(this.JFeesCollector.transactionHash);
    console.log("JFeesCollector deploy Gas: " + tx.gasUsed);
    // totcost = tx.gasUsed * GAS_PRICE;
    // console.log("JFeesCollector deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    expect(this.JFeesCollector.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JFeesCollector.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log("JFeesCollector address: " + this.JFeesCollector.address);
    tx = await this.JFeesCollector.initialize({ from: factoryOwner });
    console.log("JFeesCollector Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("JFeesCollector Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JFeesCollector.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("JFeesCollector owner address: " + result);
  });

  it('deploys JPriceOracle', async function () {
    this.JPriceOracle = await JPriceOracle.new({ from: factoryOwner });
    tx = await web3.eth.getTransactionReceipt(this.JPriceOracle.transactionHash);
    console.log("JPriceOracle deploy Gas: " + tx.gasUsed);
    // totcost = tx.gasUsed * GAS_PRICE;
    // console.log("JPriceOracle deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    expect(this.JPriceOracle.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JPriceOracle.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log("JPriceOracle address: " + this.JPriceOracle.address);
    tx = await this.JPriceOracle.initialize(ZERO_ADDRESS, ZERO_ADDRESS, { from: factoryOwner });
    console.log("JPriceOracle Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("JPriceOracle Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JPriceOracle.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("JPriceOracle owner address: " + result);
  });

  it('set new admin in Price oracle contract', async function () {
    tx = await this.JPriceOracle.addAdmin(factoryAdmin, {from: factoryOwner});
    // console.log(tx.receipt.gasUsed);
    // totcost = tx.gasUsed * GAS_PRICE;
    // console.log("New admin costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    expect(await this.JPriceOracle.isAdmin(factoryAdmin)).to.be.true;
  });

  it('deploys Tranches Deployer', async function () {
    console.log("TokenOwner address: " + factoryOwner);
    this.JTranchesDeployer = await JTranchesDeployer.new({
      from: factoryOwner
    });
    tx = await web3.eth.getTransactionReceipt(this.JTranchesDeployer.transactionHash);
    console.log("Tranches Deployer deploy Gas: " + tx.gasUsed);
    expect(this.JTranchesDeployer.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JTranchesDeployer.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`Tranches Deployer Address: ${this.JTranchesDeployer.address}`);
    result = await this.JTranchesDeployer.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    console.log("Tranches deployer owner: " + result);
    tx = await this.JTranchesDeployer.initialize({
      from: factoryOwner
    });
    console.log("Tranches Deployer Initialize Gas: " + tx.receipt.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ETH Tranche A deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JTranchesDeployer.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("Tranches Deployer address: " + result);
  });

  it('deploys JCompound contract', async function () {
    this.JCompound = await JCompound.new({
      from: factoryOwner
    });
    expect(this.JCompound.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JCompound.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`JCompound Address: ${this.JCompound.address}`);
    tx = await web3.eth.getTransactionReceipt(this.JCompound.transactionHash);
    console.log("JCompound deploy Gas: " + tx.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ETH Tranche B deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JCompound.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    tx = await this.JCompound.initialize(this.JPriceOracle.address, this.JFeesCollector.address, this.JTranchesDeployer.address, {
        from: factoryOwner
      });
    console.log("JCompound Initialize Gas: " + tx.receipt.gasUsed);
    result = await this.JCompound.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("JCompound owner address: " + result);
  });

  it('set protocol address in tranches deployer', async function () {
    tx = await this.JTranchesDeployer.setJCompoundAddress(this.JCompound.address, {
      from: factoryOwner
    });
    console.log("JTranchesDeployer set protocol address Gas: " + tx.receipt.gasUsed);
    jcomp = await this.JTranchesDeployer.jCompoundAddress();
    expect(jcomp).to.be.equal(this.JCompound.address);
  });

  it('deploys JCompound configuration', async function () {
    tx = await this.JCompound.setCEtherContract(FAKE_ADDRESS, {from: factoryOwner});
    tx = await this.JCompound.setCTokenContract(this.DAI.address, FAKE_ADDRESS, {from: factoryOwner});
    tx = await this.JCompound.addTrancheToProtocol(this.DAI.address, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", 400, 8, 18, {from: factoryOwner});
    trParams = await this.JCompound.trancheParameters(0);
    console.log("Dai Tranche A Token Address: " + trParams.ATrancheAddress);
    console.log("Dai Tranche B Token Address: " + trParams.BTrancheAddress);
  });
}



function sendDAItoProtocol (tokenOwner) {

  it('send some DAI to JCompound', async function () {
    tx = await this.DAI.transfer(this.JCompound.address, web3.utils.toWei('1000000','ether'), { from: tokenOwner });
    console.log("Gas to transfer DAI to JCompound: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await this.DAI.balanceOf(this.JCompound.address);
    console.log(`protocol DAI Balance: ${web3.utils.fromWei(protBal, "ether")} DAI`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(1000000).toString());
  });
}



function sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6) {

  it('send some DAI to users', async function () {
    tx = await this.DAI.transfer(user1, web3.utils.toWei('100000','ether'), { from: tokenOwner });
    console.log("Gas to transfer DAI to user1: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user1);
    console.log(`user1 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(100000).toString());

    tx = await this.DAI.transfer(user2, web3.utils.toWei('200000','ether'), { from: tokenOwner });
    console.log("Gas to transfer DAI to user2: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user2);
    console.log(`user2 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(200000).toString());

    tx = await this.DAI.transfer(user3, web3.utils.toWei('300000','ether'), { from: tokenOwner });
    console.log("Gas to transfer DAI to user3: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user3);
    console.log(`user3 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(300000).toString());

    tx = await this.DAI.transfer(user4, web3.utils.toWei('400000','ether'), { from: tokenOwner });
    console.log("Gas to transfer DAI to user4: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user4);
    console.log(`user4 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(400000).toString());

    tx = await this.DAI.transfer(user5, web3.utils.toWei('500000','ether'), { from: tokenOwner });
    console.log("Gas to transfer DAI to user5: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user5);
    console.log(`user5 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(500000).toString());

    tx = await this.DAI.transfer(user6, web3.utils.toWei('600000','ether'), { from: tokenOwner });
    console.log("Gas to transfer DAI to user6: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user6);
    console.log(`user6 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(600000).toString());
  });
}



function deployCompoundContracts(factoryOwner) {
  
    it('deploys cEther contract', async function () {
      console.log("TokenOwner address: " + factoryOwner);
      this.CEther = await CEther.new({
        from: factoryOwner
      });
      expect(this.CEther.address).to.be.not.equal(ZERO_ADDRESS);
      expect(this.CEther.address).to.match(/0x[0-9a-fA-F]{40}/);
      console.log(`cEther Address: ${this.CEther.address}`);
      result = await this.CEther.owner();
      console.log("ETH deployer owner: " + result);

    });

    it('deploys cErc20 contract', async function () {
        console.log("TokenOwner address: " + factoryOwner);
        this.CErc20 = await CErc20.new({
          from: factoryOwner
        });
        expect(this.CErc20.address).to.be.not.equal(ZERO_ADDRESS);
        expect(this.CErc20.address).to.match(/0x[0-9a-fA-F]{40}/);
        console.log(`cEther Address: ${this.CErc20.address}`);
        result = await this.CErc20.owner();
        console.log("CErc20 owner: " + result);
  
      });

}


module.exports = {
  deployMinimumFactory,
  sendDAItoProtocol,
  sendDAItoUsers,
  deployCompoundContracts
};