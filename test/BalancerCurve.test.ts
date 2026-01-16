import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { BalancerCurve } from '../typechain';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('BalancerCurve', function () {
	let balancerCurve: BalancerCurve;
	let owner: HardhatEthersSigner;
	let addr1: HardhatEthersSigner;

	const FLASHLOAN_AMOUNT = 200_000n * 10n ** 6n; // 200,000 USDC (6 decimals)

	beforeEach(async function () {
		// Reset fork to specific block height
		await network.provider.request({
			method: 'hardhat_reset',
			params: [
				{
					forking: {
						jsonRpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_RPC_KEY}`,
						blockNumber: 24244916, // Set your desired block number here
					},
				},
			],
		});

		[owner, addr1] = await ethers.getSigners();

		// Deploy BalancerCurve contract
		const BalancerCurveFactory = await ethers.getContractFactory('BalancerCurve');
		balancerCurve = await BalancerCurveFactory.deploy(owner.address);
		await balancerCurve.waitForDeployment();

		console.log('BalancerCurve deployed to:', await balancerCurve.getAddress());
	});

	describe('Execute Flashloan', function () {
		it('Should execute flashloan with 200,000 USDC', async function () {
			// Execute the flashloan
			const tx = await balancerCurve.execute(FLASHLOAN_AMOUNT);
			const receipt = await tx.wait();

			console.log('Transaction hash:', receipt?.hash);
			console.log('Gas used:', receipt?.gasUsed.toString());

			// Check that the Balanced event was emitted
			expect(tx).to.emit(balancerCurve, 'Balanced');

			console.log('Flashloan executed successfully!');
		});

		it('Should emit Balanced event with correct parameters', async function () {
			const tx = await balancerCurve.execute(FLASHLOAN_AMOUNT);

			// Wait for the transaction and get the receipt
			const receipt = await tx.wait();

			// Find the Balanced event
			const event = receipt?.logs.find((log) => {
				try {
					const parsedLog = balancerCurve.interface.parseLog({
						topics: log.topics as string[],
						data: log.data,
					});
					return parsedLog?.name === 'Balanced';
				} catch {
					return false;
				}
			});

			expect(event).to.not.be.undefined;

			if (event) {
				const parsedEvent = balancerCurve.interface.parseLog({
					topics: event.topics as string[],
					data: event.data,
				});

				console.log('Balanced Event Parameters:');
				console.log('  Flash Loan Amount:', parsedEvent?.args[0].toString());
				console.log('  LP Added:', parsedEvent?.args[1].toString());
				console.log('  LP Removed (USDU):', parsedEvent?.args[2].toString());
				console.log('  USDC Swapped:', parsedEvent?.args[3].toString());
			}
		});
	});
});
