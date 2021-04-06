require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
var { abi } = require('../build/contracts/myERC20.json');

var JFeesCollector = artifacts.require("JFeesCollector");
var JPriceOracle = artifacts.require("JPriceOracle");
var myERC20 = artifacts.require("myERC20");
var CErc20 = artifacts.require('CErc20');
var CEther = artifacts.require('CEther');

var JCompound = artifacts.require('JCompound');
var JTranchesDeployer = artifacts.require('JTranchesDeployer');

var JTrancheAToken = artifacts.require('JTrancheAToken');
var JTrancheBToken = artifacts.require('JTrancheBToken');


module.exports = async (deployer, network, accounts) => {
  const MYERC20_TOKEN_SUPPLY = 5000000;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  //const daiRequest = 100 * Math.pow(10, 18);
  //const DAI_REQUEST_HEX = "0x" + daiRequest.toString(16);
  //const ethRpb = 1 * Math.pow(10, 9);
  //const ETH_RPB_HEX = "0x" + ethRpb.toString(16);

  if (network == "development") {
    //const tokenOwner = accounts[0];
    //const myDAIinstance = await deployProxy(myERC20, [MYERC20_TOKEN_SUPPLY], { from: tokenOwner });
    await deployer.deploy(myERC20, MYERC20_TOKEN_SUPPLY);
    const myDAIinstance = await myERC20.deployed();
    console.log('myDAI Deployed: ', myDAIinstance.address);

    //const mycEthinstance = await deployProxy(CEther, [], { from: tokenOwner });
    await deployer.deploy(CEther);
    const mycEthinstance = await CEther.deployed();
    console.log('myCEth Deployed: ', mycEthinstance.address);

    //const mycDaiinstance = await deployProxy(CErc20, [], { from: tokenOwner });
    await deployer.deploy(CErc20);
    const mycDaiinstance = await CErc20.deployed();
    console.log('myCErc20 Deployed: ', mycDaiinstance.address);

    //const factoryOwner = accounts[0];
    //const JFCinstance = await deployProxy(JFeesCollector, [], { from: factoryOwner });
    await deployer.deploy(JFeesCollector);
    const JFCinstance = await JFeesCollector.deployed();
    console.log('JFeesCollector Deployed: ', JFCinstance.address);

    //const JPOinstance = await deployProxy(JPriceOracle, [], { from: factoryOwner });
    await deployer.deploy(JPriceOracle);
    const JPOinstance = await JPriceOracle.deployed();
    console.log('JPriceOracle Deployed: ', JPOinstance.address);

    //const JTDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner });
    await deployer.deploy(JTranchesDeployer);
    var JTDeployer = await JTranchesDeployer.deployed();
    console.log("Tranches Deployer: " + JTDeployer.address);

    //const JCinstance = await deployProxy(JCompound, [JPOinstance.address, JFCinstance.address, JTDeployer.address], { from: factoryOwner });
    await deployer.deploy(JCompound, JPOinstance.address, JFCinstance.address, JTDeployer.address);
    const JCinstance = await JCompound.deployed();
    console.log('JCompound Deployed: ', JCinstance.address);

    await JTDeployer.setJCompoundAddress(JCinstance.address);

    await JCinstance.setCEtherContract(mycEthinstance.address);
    await JCinstance.setCTokenContract(myDAIinstance.address, mycDaiinstance.address);

    await JCinstance.addTrancheToProtocol(ZERO_ADDRESS, "jEthTrancheAToken", "JEA", "jEthTrancheBToken", "JEB", web3.utils.toWei("0.04", "ether"), 18, 18);
    trParams = await JCinstance.trancheAddresses(0);
    let EthTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Eth Tranche A Token Address: " + EthTrA.address);
    let EthTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Eth Tranche B Token Address: " + EthTrB.address);

    await JCinstance.addTrancheToProtocol(myDAIinstance.address, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", web3.utils.toWei("0.03", "ether"), 18, 18);
    trParams = await JCinstance.trancheAddresses(1);
    let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Dai Tranche A Token Address: " + DaiTrA.address);
    let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Dai Tranche B Token Address: " + DaiTrB.address);

  } else if (network == "kovan") {
    let { FEE_COLLECTOR_ADDRESS, PRICE_ORACLE_ADDRESS, IS_UPGRADE, CDAI_ADDRESS, DAI_ADDRESS, CETH_ADDRESS } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {

      console.log('contracts are upgraded');
    } else {
      // deployed new contract
      try {
        const compoundDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
        console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`);

        // CETHAddress for Kovan: 0x41B5844f4680a8C38fBb695b7F9CFd1F64474a72
        // DAIAddress for Kovan: 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa 
        // CDAIAddress for Kovan: 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD
        // Source: https://github.com/compound-finance/compound-config/blob/master/networks/kovan.json
        const JPOinstance = await deployProxy(JPriceOracle, [], { from: factoryOwner });
        console.log('JPriceOracle Deployed: ', JPOinstance.address);

        const JCompoundInstance = await deployProxy(JCompound, [JPOinstance.address, FEE_COLLECTOR_ADDRESS, compoundDeployer.address],
          { from: factoryOwner });

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        compoundDeployer.setJCompoundAddress(JCompoundInstance.address);

        console.log('compound deployer 1');
        // TODO: dai address need to make it dynamic 
        await JCompoundInstance.setCTokenContract(DAI_ADDRESS, CDAI_ADDRESS, { from: factoryOwner });

        console.log('compound deployer 2');
        await JCompoundInstance.setCEtherContract(CETH_ADDRESS, { from: factoryOwner });

        console.log('compound deployer 3');
        await JCompoundInstance.addTrancheToProtocol(DAI_ADDRESS, "cDAI tranche A", "CDAIA", "cDAI tranche B", "CDAIB", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });

        console.log('compound deployer 4');
        await JCompoundInstance.addTrancheToProtocol(ZERO_ADDRESS, "trAcEth", "CETA", "trBcEth", "CETB", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });

        console.log('compound deployer 5');
        console.log(`JCompound deployed at: ${JCompoundInstance.address}`);
      } catch (error) {
        console.log(error);
      }
    }
  }
}