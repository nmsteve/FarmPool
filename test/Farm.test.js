const Farm = artifacts.require('./Farm.sol');
const Reward = artifacts.require('./Reward.sol');
const LpPair = artifacts.require('./LpPair.sol');
const { waitUntilBlock } = require('./helpers/tempo')(web3)


contract('Farm', ([owner, alice, bob, carl]) => {

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

    describe('1. when Farm contract is Deployed', () => {
        it('is linked to the Mock reward Reward token', async () => {
            const linked = await this.farm.reward();
            assert.equal(linked, this.reward.address);
        });

        it('is configured to reward 100 MOCK per block', async () => {
            const rewardPerBlock = await this.farm.rewardPerBlock();
            assert.equal(rewardPerBlock, 100);
        });

        it('is configured with the correct start block', async () => {
            const startBlock = await this.farm.startBlock();
            const endBlock = await this.farm.endBlock();
            assert.equal(true, startBlock > 0 && startBlock  < endBlock);
        });

        it('is initialized for the Lp-Pair1 token', async () => {
            const poolLength = await this.farm.poolLength();
            assert.equal(1, poolLength);

            const poolInfo = await this.farm.poolInfo(0);
            assert.equal(poolInfo[0], this.lpPair.address);
            assert.equal(poolInfo[1].words[0], 15);

            const totalAllocPoint = await this.farm.totalAllocPoint();
            assert.equal(totalAllocPoint, 15);
        });

        it('holds 10,000 MOCK Token', async () => {
            const balance = await this.reward.balanceOf(this.farm.address);
            assert.equal(balance, 10000)
        });

        it('will run for 100 blocks', async () => {
            const endBlock = await this.farm.endBlock();
            const startBlock = await this.farm.startBlock();
            assert.equal(100, endBlock - startBlock);
        });
    });

    describe('2. before the start block', () => {
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

        it('allows participants to join', async () => {
            const balanceFarm = await this.lpPair.balanceOf(this.farm.address);
            assert.equal(2000, balanceFarm);

            const balanceAlice = await this.lpPair.balanceOf(alice);
            const stakedAlice = await this.farm.stakedLP(0, alice);
            assert.equal(3500, balanceAlice);
            assert.equal(1500, stakedAlice);

            const balanceBob = await this.lpPair.balanceOf(bob);
            const stakedBob = await this.farm.stakedLP(0, bob);
            assert.equal(0, balanceBob);
            assert.equal(500, stakedBob);
        });

        it('does not assign any rewards yet', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(0, totalPending);
        });
    })

    describe('3. after 10 blocks of farming', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 10);
        });

        it('has a total reward of 1000 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(1000, totalPending);
        });

        it('reserved 750 for alice and 250 for bob', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(750, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(250, pendingBob);
        });
    });

    describe('4. with a 3th participant after 30 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 28);

            await this.lpPair.approve(this.farm.address, 2000, { from: carl });
            await this.farm.stakeLP(0, 2000, {from: carl});
        });

        it('has a total reward of 3000 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(3000, totalPending);
        });

        it('reserved 2250 for alice, 750 for bob, and nothing for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(2250, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(750, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(0, pendingCarl);
        });
    });

    describe('5. after 50 blocks of farming', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 50);
        });

        it('6. has a total reward of 5000 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(5000, totalPending);
        });

        it('7. reserved 3000 for alice, 1000 for bob, and 1000 for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(3000, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(1000, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(1000, pendingCarl);
        });
    });

    describe('8. with a participant withdrawing after 70 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 69);
            await this.farm.withdrawLP(0, 1500, {from: alice});
        });

        it('gives alice 3750 MOCK and 1500 LP', async () => {
            const balanceReward = await this.reward.balanceOf(alice);
            assert.equal(3750, balanceReward);

            const balanceLP = await this.lpPair.balanceOf(alice);
            assert.equal(5000, balanceLP);
        });

        it('has no stake for alice', async () => {
            const staked = await this.farm.stakedLP(0, alice);
            assert.equal(0, staked);
        });

        it('has a total reward of 3250 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(3250, totalPending);
        });

        it('reserved nothing for alice, 1250 for bob, and 2000 for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(1250, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(2000, pendingCarl);
        });
    });

    describe('9. with a participant partially withdrawing after 80 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 79);
            await this.farm.withdrawLP(0, 1500, {from: carl});
        });

        it('gives carl 2800 MOCK and 1500 LP', async () => {
            const balanceReward = await this.reward.balanceOf(carl);
            assert.equal(2800, balanceReward);

            const balanceLP = await this.lpPair.balanceOf(carl);
            assert.equal(1500, balanceLP);
        });

        it('has a 500 LP-Pair1 staked for carl', async () => {
            const staked = await this.farm.stakedLP(0, carl);
            assert.equal(500, staked);
        });

        it('has a total reward of 1450 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(1450, totalPending);
        });

        it('reserved nothing for alice, 1450 for bob, and nothing for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(1450, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(0, pendingCarl);
        });
    });

    describe('10 when it receives more funds (8000 MOCK)', () => {
        before(async () => {
            await this.reward.approve(this.farm.address, 8000);
            await this.farm.fundFarm(8000);
        });

        it('runs for 180 blocks (80 more)', async () => {
            const endBlock = await this.farm.endBlock();
            assert.equal(180, endBlock - this.startBlock);
        });
    });

    describe('11 with an added lp token (for 25%) after 100 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 99);
            this.farm.addFarm(5, this.lpPair2.address, true);
        });

        it('is initialized for the LP token 2', async () => {
            const poolLength = await this.farm.poolLength();
            assert.equal(1, poolLength);
        });

        it('reserved nothing for alice, 2450 for bob, and 1000 for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(2450, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(1000, pendingCarl);
        });
    });

    describe('12 with 1st participant for lpPair2 after 110 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 108);
            

            await this.lpPair2.approve(this.farm.address, 500, { from: carl });
            await this.farm.stakeLP(1, 500, {from: carl});
        });

        it('holds 1000 Lp-Pair1 for the participants (Farm 1)', async () => {
            const balanceFarm = await this.lpPair.balanceOf(this.farm.address);
            assert.equal(1000, balanceFarm);

            const stakeAlice = await this.farm.stakedLP(0, alice);
            assert.equal(0, stakeAlice);

            const stakeBob = await this.farm.stakedLP(0, bob);
            assert.equal(500, stakeBob);

            const stakeCarl = await this.farm.stakedLP(0, carl);
            assert.equal(500, stakeCarl);
        });

        it('holds 500 LP-Pair2 for the participants (Farm2', async () => {
            const balanceFarm = await this.lpPair2.balanceOf(this.farm.address);
            assert.equal(500, balanceFarm);

            const stakeAlice = await this.farm.stakedLP(1, alice);
            assert.equal(0, stakeAlice);

            const stakeBob = await this.farm.stakedLP(1, bob);
            assert.equal(0, stakeBob);

            const stakeCarl = await this.farm.stakedLP(1, carl);
            assert.equal(500, stakeCarl);
        });

        it('has a total reward of 4450 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(4450, totalPending);
        });

        it('reserved 75% for LP-Pair1 (50/50 bob/carl)', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(2825, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(1375, pendingCarl);
        });

        it('reserved 25% for LP_Pair2 (not rewarded) -> 250 MOCK inaccessible', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(1, bob);
            assert.equal(0, pendingBob);

            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(0, pendingCarl);
        });
    });

    describe('13 with 2nd participant for lpPair2 after 120 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 118);

            await this.lpPair2.approve(this.farm.address, 1000, { from: alice });
            await this.farm.stakeLP(1, 1000, {from: alice});
        });

        it('holds 1500 lP-Pair2 for the participants', async () => {
            const balanceFarm = await this.lpPair2.balanceOf(this.farm.address);
            assert.equal(1500, balanceFarm);

            const stakeAlice = await this.farm.stakedLP(1, alice);
            assert.equal(1000, stakeAlice);

            const stakeBob = await this.farm.stakedLP(1, bob);
            assert.equal(0, stakeBob);

            const stakeCarl = await this.farm.stakedLP(1, carl);
            assert.equal(500, stakeCarl);
        });

        it('has a total reward of 5450 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(5450, totalPending);
        });

        it('reserved 75% for LP-Pair1 with 3200 for bob and 1750 for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(3200, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(1750, pendingCarl);
        });

        it('reserved 25% for lP-Pair2 with 250 for carl', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(1, bob);
            assert.equal(0, pendingBob);

            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(250, pendingCarl);
        });
    });

    describe('14 after 140 blocks of farming', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 140);
        });

        it('has a total reward of 7450 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(7450, totalPending);
        });

        it('reserved 75% for LP-Pair1 with 3950 for bob and 2500 for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(3950, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(2500, pendingCarl);
        });

        it('reserved 25% for LP-Pair2 with 333 for alice and 416 for carl', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(333, pendingAlice);

            const pendingBob = await this.farm.pending(1, bob);
            assert.equal(0, pendingBob);

            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(416, pendingCarl);
        });
    });

    describe('15 with a participant partially withdrawing lpPair2 after 150 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 149);
            await this.farm.withdrawLP(1, 200, {from: carl});
        });

        it('gives carl 500 MOCK and 200 LP-Pair1', async () => {
            const balancereward = await this.reward.balanceOf(carl);
            assert.equal(3300, balancereward);

            const balanceLP = await this.lpPair2.balanceOf(carl);
            assert.equal(500, balanceLP);
        });

        it('has a total reward of 7950 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(7950, totalPending);
        });

        it('reserved 75% for LP-Pair1 with 4325 for bob and 2875 for carl', async () => {
            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(4325, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(2875, pendingCarl);
        });

        it('reserved 25% for LP-Pair2 with 500 for alice and nothing for carl', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(500, pendingAlice);

            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(0, pendingCarl);
        });

        it('holds 1000 LP for the participants', async () => {
            const balanceFarm = await this.lpPair.balanceOf(this.farm.address);
            assert.equal(1000, balanceFarm);

            const stakeBob = await this.farm.stakedLP(0, bob);
            assert.equal(500, stakeBob);

            const stakeCarl = await this.farm.stakedLP(0, carl);
            assert.equal(500, stakeCarl);
        });

        it('holds 1300 lpPair2 for the participants', async () => {
            const balanceFarm = await this.lpPair2.balanceOf(this.farm.address);
            assert.equal(1300, balanceFarm);

            const stakeAlice = await this.farm.stakedLP(1, alice);
            assert.equal(1000, stakeAlice);

            const stakeCarl = await this.farm.stakedLP(1, carl);
            assert.equal(300, stakeCarl);
        });
    });

    describe('16 with a participant doing an emergency withdraw LP-Pair2 after 160 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 159);
            await this.farm.emergencyWithdraw(1, {from: carl});
        });

        it('gives carl 500 LP-Pair', async () => {
            const balanceLP = await this.lpPair2.balanceOf(carl);
            assert.equal(800, balanceLP);
        });

        it('gives carl no MOCK', async () => {
            const balancereward = await this.reward.balanceOf(carl);
            assert.equal(3300, balancereward);
        });

        it('holds no LP-Pair2 for carl', async () => {
            const stakeCarl = await this.farm.stakedLP(1, carl);
            assert.equal(0, stakeCarl);
        });

        it('has no reward for carl', async () => {
            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(0, pendingCarl);
        });

        it('holds 1000 LP-Pair2 for alice', async () => {
            const balanceFarm = await this.lpPair2.balanceOf(this.farm.address);
            assert.equal(1000, balanceFarm);

            const stakeAlice = await this.farm.stakedLP(1, alice);
            assert.equal(1000, stakeAlice);
        });

        it('has 750 MOCK pending for alice (receives bobs share)', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(750, pendingAlice);
        });
    });

    describe('17 when closed after 180 blocks', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 180);
        });

        it('has a total reward of 10950 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(10950, totalPending);
        });

        it('reserved 75% for LP-Pair1 with 4325 for bob and 2875 for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(5450, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(4000, pendingCarl);
        });

        it('reserved 25% for LP-Pair2 with 1250 for alice', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(1250, pendingAlice);

            const pendingBob = await this.farm.pending(1, bob);
            assert.equal(0, pendingBob);

            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(0, pendingCarl);
        });
    });

    describe('18 when closed for 20 blocks (after 200 blocks)', () => {
        before(async () => {
            await waitUntilBlock(10, this.startBlock + 200);
        });

        it('still has a total reward of 10950 MOCK pending', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(10950, totalPending);
        });

        it('has a pending reward for LP-Pair1 5450 for bob and 4000 for carl', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(5450, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(4000, pendingCarl);
        });

        it('has a pending reward for LP-Pair2 with 1250 for alice', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(1250, pendingAlice);

            const pendingBob = await this.farm.pending(1, bob);
            assert.equal(0, pendingBob);

            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(0, pendingCarl);
        });
    });

    describe('19 with participants withdrawing after closed', async () => {
        before(async () => {
            await this.farm.withdrawLP(1, 1000, {from: alice});
            await this.farm.withdrawLP(0, 500, {from: bob});
            await this.farm.withdrawLP(0, 500, {from: carl});
        });

        it('gives alice 1250 MOCK and 1000 lP-Pair2', async () => {
            const balancereward = await this.reward.balanceOf(alice);
            assert.equal(5000, balancereward);

            const balanceLP = await this.lpPair.balanceOf(alice);
            assert.equal(5000, balanceLP);

            const balancelpPair2 = await this.lpPair2.balanceOf(alice);
            assert.equal(1000, balancelpPair2);
        });

        it('gives carl 5450 MOCK and 500 LP-Pair', async () => {
            const balancereward = await this.reward.balanceOf(bob);
            assert.equal(5450, balancereward);

            const balanceLP = await this.lpPair.balanceOf(bob);
            assert.equal(500, balanceLP);
        });

        it('gives carl 4000 MOCK and 500 LP-Pair', async () => {
            const balancereward = await this.reward.balanceOf(carl);
            assert.equal(7300, balancereward);

            const balanceLP = await this.lpPair.balanceOf(carl);
            assert.equal(2000, balanceLP);

            const balancelpPair2 = await this.lpPair2.balanceOf(carl);
            assert.equal(800, balancelpPair2);
        });

        it('has an end balance of 250 MOCK, which is lost forever', async () => {
            const totalPending = await this.farm.totalPending();
            assert.equal(250, totalPending);

            const balanceFarm = await this.reward.balanceOf(this.farm.address);
            assert.equal(250, balanceFarm);
        });

        it('has no pending reward for LP_Pair1', async () => {
            const pendingAlice = await this.farm.pending(0, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(0, bob);
            assert.equal(0, pendingBob);

            const pendingCarl = await this.farm.pending(0, carl);
            assert.equal(0, pendingCarl);
        });

        it('has no pending reward for LP-Pair2', async () => {
            const pendingAlice = await this.farm.pending(1, alice);
            assert.equal(0, pendingAlice);

            const pendingBob = await this.farm.pending(1, bob);
            assert.equal(0, pendingBob);

            const pendingCarl = await this.farm.pending(1, carl);
            assert.equal(0, pendingCarl);
        });
    });
});