# FarmPool

FarmPool is a Blockchain project that mimic the panacakeswap.finance Farm. It is developed using Solidity Smart Contract development language.

## How it works

Participants will receive ERC20 reward tokens in proportion to the quantity of ERC20 LP tokens staked in the `Farm` contract. 
The ERC20 reward tokens are not minted; instead, they  are used to fund the `Farm` contract.

**Note:** Reward and LP tokens are just mock tokens to facilitated creation of the farm.

## Testing

prerequisite: Have NodeJs+NPM and Truffle installed

Install the dependencies

```
npm i
```

Start a development Blockchain Network

```
truffle develop
```
Run the test

```
truffle test
```

## Deployment

Using the `config.json` file to pass constructor parameters.

1. `Reward` contract: pass `name`, `symbol` and `supply`.

2. `LpPair` contract: pass `name` , `symbol` and `allocPoint` (allocation poits) .You many deploy several pairs  as shown in the config file.

3. `Farm` contruct: pass  the `rewardPerBlock` and the `startBlock`. StartBlock is the block number in which farming will begin.

Set up a Network

Replace the `.env` copy file with your account details and rename to `.env`. This will pass the necessary data to the `truffle-config.js` file used for deployment in truffle.

Deploy on a network

```
truffle migrate --network <network name as specified in truffle-config.js>

e.g truffle migrate --network matic

```


## Using the Farm.

### Funding

Before the start block, the `Farm` contract must be funded.

To fund the contract, the `Farm` must be permitted to withdraw a quantity of  reward tokens
via the reward token contract's `approve` method.

With the right amount, call the `fundFarm` method. The last block is calculated as follows:

        endBlock = startBlock + (funds / rewardPerBlock)

While the farm is going, you can add funds and increase the end block.

The farm will be closed if the end block is reached, and funds will no longer be able to be added.

You can, however, restart the farm to begin a new farming phase using the `restartFarm` method

### Add a Pair

Users who have staked specified LP tokens will receive reward tokens.Each LP token has a specific contract address.
To add a liquidity pair for which the farm will pay a reward, use the `addFarm` method.

The `allocPoint` parameter is passed to the `addFarm` method. When you add several pair, this determines how much of the incentive is split for each LP token.

If three pairs with a `allocPoint` of 6, 12, 18 respectivily are added,   There are 36 alloc points in all. Participants that staked the pair with 6 alloc points receive 1/6th of the tokens ('6 / 36 = 1/6').

The `update` method can be used to adjust the alloc points at a later time.

### Staking 

Users must stake LP tokens using the `stakeLP` method to participate in farming.

The `Farm` must be authorized to withdraw LP tokens before using this method. The LP token contract's `approve` method is used to do this.

**Note** ` _pid` is the index of the deployed `LpPair` and ` amount` is the number of LP tokens you want to stake.

The `stakedLP` method can be used to check the current staked amount.

The `withdrawLP` method allows participants to withdraw their LP tokens at any time.
