const Reward= artifacts.require("./Reward.sol");
const LpPair = artifacts.require('./LpPair.sol');
const Farm = artifacts.require("./Farm.sol");
require('dotenv').config() 

module.exports = async done => {

  try {
    
    const [owner, alice, bob, carl] = await web3.eth.getAccounts();
    const reward = await Reward.at(process.env.REWARD);
    const farm =   await Farm.at("p0xA66EF855a4F345c857C33577AD3b682384e40e76")
    const LpPair1 = await LpPair.at(process.env.LpPair1)
    const LpPair2 = await LpPair.at(process.env.LpPair2)
    const LpPair3 = await LpPair.at(process.env.LpPair3)
    const CakePool = await LpPair.at()


    // const [balanceAlice, balanceBob, balanceCarl] = await Promise.all([
    //     LpPair2.balanceOf(alice),
    //     LpPair2.balanceOf(bob),
    //     LpPair2.balanceOf(carl),
    // ]);

    console.log(balanceAlice.toString(),balanceBob.toString(),balanceCarl.toString())


    

    } catch(e) {
      console.log(e);
    }
    
  done();
};

