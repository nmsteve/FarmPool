const Farm = artifacts.require('./Farm.sol');
const Reward = artifacts.require('./Reward.sol');
const LpPair = artifacts.require('./LpPair.sol');
const CakePool = artifacts.require('./CakePool.sol');
require('dotenv').config();



const { waitUntilBlock } = require('./helpers/tempo')(web3);

contract('CakePool', ([owner, alice, bob, carl,treasury, operator,]) => {

    before(async () => {
        this.reward = await Reward.new("Mock token", "MOCK", 1000000);
        let balance = await this.reward.balanceOf(owner);
        assert.equal(balance.valueOf(), 1000000);

        this.lpPair = await LpPair.new("LpPair Token", "Lp-Pair1");
        this.lpPair2 = await LpPair.new("LpPair Token 2", "Lp-Pair2");

        const currentBlock = await web3.eth.getBlockNumber();
        this.startBlock = currentBlock + 100;

        this.farm = await Farm.new(this.reward.address, 100, this.startBlock);
        this.farm.addFarm(15, this.lpPair.address, false);

        await this.reward.approve(this.farm.address, 10000);
        await this.farm.fundFarm(10000);

        this.CakePool =  await CakePool.new(
            this.reward.address,
            this.farm.address,
            owner,
            treasury,
            operator,
            0 ) 

    });

    before(async () => {
        await Promise.all([
            this.lpPair.mint(alice, 5000),
            this.lpPair.mint(bob, 500),
            this.lpPair.mint(carl, 2000),
        ]);

        const [balanceAlice, balanceBob, balanceCarl] = await Promise.all([
            this.lpPair.balanceOf(alice),
            this.lpPair.balanceOf(bob),
            this.lpPair.balanceOf(carl),
        ]);

        assert.equal(5000, balanceAlice);
        assert.equal(500, balanceBob);
        assert.equal(2000, balanceCarl);
    });

    before(async () => {
        await Promise.all([
            this.lpPair2.mint(alice, 1000),
            this.lpPair2.mint(carl, 800),
        ]);

        const [balanceAlice, balanceBob, balanceCarl] = await Promise.all([
            this.lpPair2.balanceOf(alice),
            this.lpPair2.balanceOf(bob),
            this.lpPair2.balanceOf(carl),
        ]);

        assert.equal(1000, balanceAlice);
        assert.equal(0, balanceBob);
        assert.equal(800, balanceCarl);
    });

    describe('1. When Cake Pool is Deployed', () => {
        it('is linked to the Mock reward Reward token', async () => {
            const linked = await this.CakePool.token();
            assert.equal(linked, this.reward.address);
        });

        it('is initialized for the Lp-Pair1 token', async () => {
            const cakePoolPID = await this.CakePool.cakePoolPID();
            assert.equal(0, cakePoolPID.words[0]);

        });

        
    });
    

    describe('Alice and Bob staking CAKE after 10 blocks of farming', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 10);
        });

        it('has a total reward of 1000 MOCK pending Rewords', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(1000, totalPending.words[0]);
        });

        it('reserved 750 for alice and 250 for bob', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(750, pendingAlice.words[0]);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(250, pendingBob.words[0]);
        });
    });

    });

});
    