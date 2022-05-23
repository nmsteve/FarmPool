const Farm = artifacts.require('./Farm.sol');
const Reward = artifacts.require('./Reward.sol');
const LpPair = artifacts.require('./LpPair.sol');
const CakePool = artifacts.require('./CakePool.sol');
require('dotenv').config();

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { waitUntilBlock } = require('./helpers/tempo')(web3);

contract(CakePool,([owner, alice, bob, carl,treasury, operator,]) => {

    before(async () => {
        const supply = new BN("100000000000000000000000000000000000000000000000000000000000")
        this.reward = await Reward.new("Mock token", "MOCK", supply);
        let balance = await this.reward.balanceOf(owner);
        (balance.toString(), 100000000000000000000000000000000000000000000000000000000000);

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
        it('is linked to the Mock reward  token', async () => {
            const linked = await this.CakePool.token();
            assert.equal(linked, this.reward.address);
        });

        it('is initialized for the Lp-Pair1 token', async () => {
            const cakePoolPID = await this.CakePool.cakePoolPID();
            assert.equal(0, cakePoolPID.words[0]);

        });

        
    });
    

    describe('2. Alice staking CAKE after 10 blocks of farming', () => {

        before(async () => {
            await Promise.all([
                this.lpPair.approve(this.farm.address, 1500, { from: alice }),
                this.lpPair.approve(this.farm.address, 500, { from: bob })
            ]);

            await Promise.all([
                this.farm.stakeLP(0, 1500, {from: alice}),
                this.farm.stakeLP(0, 500, {from: bob})
            ]);
        });

        before(async () => {
            await waitUntilBlock(10, this.startBlock + 10);
        });

        it("should fail if the amount or lock duration is less than zero", async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(1000, totalPending);
            
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(750, pendingAlice.words[0]);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(250, pendingBob.words[0]);

            await expectRevert(
                this.CakePool.deposit(0,0, {from: alice}), "Nothing to deposit"
            )
           
        });
        it('should  fail if  amount is less than MIN_DEPOSIT_AMOUNT ', async () => {

            const amount  = web3.utils.toBN(1e12)
            const week = 3600 * 24 * 7
            
            await expectRevert(
                this.CakePool.deposit(amount,week, {from: alice}), "Deposit amount must be greater than MIN_DEPOSIT_AMOUNT"
            )

        });
        it('should fail if lock duration is less than MIN_LOCK_DURATION ', async () => {

            const amount  = web3.utils.toBN(1e20*5)
            const week = 3600 * 24 * 6
            
            await expectRevert(
                this.CakePool.deposit(amount,week, {from: alice}), "Minimum lock period is one week"
            )

        });
        it("Should fail if lock duration is greater than MAX_LOCK_DURATION ", async () => {
            const amount  = web3.utils.toBN(1e20)
            const lockduration = 3600 * 24 * 367
            await expectRevert( this.CakePool.deposit(amount,lockduration,{from:alice}),'Maximum lock period exceeded')

        });

        it("Should Havest Alice pending Reward in the Farm", async () =>{
            const value = new BN('0')
            const harvest = await this.CakePool.harvest({ from: alice })
            expectEvent(harvest,"Harvest", {sender:alice,amount:value})

           

        } )
          
    });

    });

    