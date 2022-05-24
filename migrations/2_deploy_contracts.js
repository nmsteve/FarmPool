const Reward= artifacts.require("./Reward.sol");
const LpPair = artifacts.require('./LpPair.sol');
const Farm = artifacts.require("./Farm.sol");
const CakePool = artifacts.require('./CakePool.sol');
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const allConfigs = require("../config.json");


module.exports =async function(deployer, network, addresses) {

  //get  parameters from the config.json file
  const config = allConfigs[network.replace(/-fork$/, '')] || allConfigs.default;

  if (!config) {
    return;
  }

  const _Reward = config._Reward;
  

  
    const currentBlock = await web3.eth.getBlockNumber()
    _startBlock = config.startBlock + currentBlock
  
 

 
  
  let deploy = deployer;
  
  //Deploy Reward Contract
  if (!_Reward.address) {
    deploy = deploy.then(() => {
        return deployer.deploy(
           Reward,
          _Reward.name,
          _Reward.symbol,
          web3.utils.toBN(_Reward.supply)
        );
      })
      .then(() => {return Reward.deployed(); }).then((reward) => {
      
      });
  }

  //Deploy Farm contract
  deploy = deploy.then(() => {
      return deployer.deploy(
         Farm,
        _Reward.address || Reward.address,
        config.rewardPerBlock, 
        _startBlock

      );
    });

    //set the intial funding
    if (config.fund) {
      deploy = deploy.then(() => {
          return Reward.address
            ? Reward.at(Reward.address)
            : Reward.deployed();
        })
        .then((RewardInstance) => {
          return RewardInstance.approve(Farm.address, web3.utils.toBN(config.fund));
        })
        .then(() => { return Farm.deployed(); })
        .then((farmInstance) => {
          return farmInstance.fundFarm(web3.utils.toBN(config.fund));
        });
    }

    //Deploy LP pairs (3)
    config.lp.forEach((token) => {
      if (!token.address) {
        deploy = deploy.then(() => {
            return deployer.deploy(
              LpPair,
              token.name,
              token.symbol,

            );
          })
          .then(() => {
            return LpPair.deployed();
          })
          .then( (lpInstance) => {
            const amount = web3.utils.toBN(10).pow(web3.utils.toBN(token.decimals))
              .mul(web3.utils.toBN(1000));

            const promises = addresses.map((address) => {
              lpInstance.mint(address, amount);
              lpInstance.approve(Farm.address,1000000000000000,{from: address})
              return
            });

            return Promise.all(promises);
          });
      }

    // add LP-Pairs to the the Farm
      deploy = deploy.then(() => { return Farm.deployed(); })
        .then((farmInstance) => {
          farmInstance.addFarm(
            token.allocPoint,
            token.address || LpPair.address,
            false
          );
          farmInstance.stakeLP(
            0, 100, {from: addresses[2]}
          );
           return
        });

        
    });
  
    

    
    deploy = deploy.then( () => {
      
      const admin =  addresses[0]
      const treasury =addresses[4]
      const operator = addresses[5]
      const pid = 0
      
      return deployer.deploy(
           CakePool,
           Reward.address,
           Farm.address,
           admin,
           treasury,
           operator,
          pid) 

      });
    
    
    

    return deploy;
};

