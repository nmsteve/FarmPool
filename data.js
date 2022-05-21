const Reward= artifacts.require("./Reward.sol");
const LpPair = artifacts.require('./LpPair.sol');
const Farm = artifacts.require("./Farm.sol");
require('dotenv').config() 

module.exports = async done => {

  try {
    
    const [owner, alice, bob, carl] = await web3.eth.getAccounts();
    const reward = await Reward.at(process.env.REWARD);
    const farm =   await Farm.at(process.env.FARM)
    const LpPair1 = await LpPair.at(process.env.LpPair1)
    const LpPair2 = await LpPair.at(process.env.LpPair2)
    const LpPair3 = await LpPair.at(process.env.LpPair3)

    // await farm.restartFarmPool(10)
    // const startBlock = await farm.startBlock()
    // console.log(`balance Farm Rewards: ${startBlock.toString()}`);

    // await reward.approve(farm.address, 10)
    // await farm.fundFarm(10); 
    // var balance = await reward.balanceOf(farm.address)
    // console.log(`balance Farm Rewards: ${balance.toString()}`);

    await Promise.all([
        LpPair2.mint(alice, 1000),
        //LpPair2.mint(bob, 500),
        LpPair2.mint(carl, 800),
     ]);

    const [balanceAlice, balanceBob, balanceCarl] = await Promise.all([
        LpPair2.balanceOf(alice),
        LpPair2.balanceOf(bob),
        LpPair2.balanceOf(carl),
    ]);

    console.log(balanceAlice.toString(),balanceBob.toString(),balanceCarl.toString())


    

    } catch(e) {
      console.log(e);
    }
    
  done();
};

