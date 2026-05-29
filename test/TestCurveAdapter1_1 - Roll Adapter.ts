import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ICurveAdapterV1_1, ICurveStableSwapNG, IERC20, Stablecoin } from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { formatUnits, parseEther, parseUnits, zeroAddress } from 'viem';
import { ADDRESS } from '@usdu-finance/usdu-core';
import { mainnet } from 'viem/chains';
import { evm_increaseTime } from './helper';

const addr = ADDRESS[mainnet.id];

describe('ICurveAdapterV1_1: Stablecoin Integration Tests', function () {
	let stable: Stablecoin;
	let usdc: IERC20;
	let adapter: ICurveAdapterV1_1;
	let pool: ICurveStableSwapNG;

	let curator: SignerWithAddress;
	let module: SignerWithAddress;
	let user: SignerWithAddress;
	let usdcUser: SignerWithAddress;

	const USDC_TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
	const USDC_HOLDER = '0x55fe002aeff02f77364de339a1292923a15844b8';
	const HUGE_AMOUNT = '1000000';
	const TRADE_AMOUNT = '200000';

	const showDetails = async () => {
		console.log('\n=== Balances ===');
		console.table({
			User_USDC: (await usdc.balanceOf(user)).toString(),
			User_USDU: (await stable.balanceOf(user)).toString(),
			User_LP: (await pool.balanceOf(user)).toString(),
			Adapter_USDC: (await usdc.balanceOf(adapter)).toString(),
			Adapter_USDU: (await stable.balanceOf(adapter)).toString(),
			Adapter_LP: (await pool.balanceOf(adapter)).toString(),
			Adapter_Minted: (await adapter.totalMinted()).toString(),
			Pool_Balances: (await pool.get_balances()).map((b) => b.toString()).join(', '),
		});
	};

	before(async function () {
		// Reset fork to specific block height
		await network.provider.request({
			method: 'hardhat_reset',
			params: [
				{
					forking: {
						jsonRpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_RPC_KEY}`,
						blockNumber: 24246990, // Set your desired block number here
					},
				},
			],
		});

		[module, user] = await ethers.getSigners();

		// Impersonate USDC whale and curator
		await network.provider.request({ method: 'hardhat_impersonateAccount', params: [USDC_HOLDER] });
		usdcUser = await ethers.getSigner(USDC_HOLDER);

		await network.provider.request({ method: 'hardhat_impersonateAccount', params: [addr.curator] });
		curator = await ethers.getSigner(addr.curator);

		// Attach contracts
		stable = await ethers.getContractAt('Stablecoin', addr.usduStable);
		usdc = await ethers.getContractAt('IERC20', USDC_TOKEN);
		pool = await ethers.getContractAt('ICurveStableSwapNG', addr.curveStableSwapNG_USDUUSDC_2);
		adapter = await ethers.getContractAt('ICurveAdapterV1_1', addr.usduCurveAdapterV1_1_USDC_2);

		// Fund curator
		await module.sendTransaction({ to: curator.address, value: parseEther('10') });

		// Fund user with USDC
		await usdc.connect(usdcUser).transfer(user.address, parseUnits(HUGE_AMOUNT, 6));

		// Register module to fund USDU
		await stable.connect(curator).setModule(module, 9999999999999, 'Module');
		await evm_increaseTime(3600 * 24 * 10);
		await stable.connect(curator).acceptModule(module);
		await stable.connect(module).mintModule(user.address, parseUnits(HUGE_AMOUNT, 18));

		// show init details
		await showDetails();
	});

	describe('Roll Adapter Tests', function () {
		it('User adds liquidity to simulate symmetric input from new adapter', async function () {
			await usdc.connect(user).approve(pool, parseUnits(HUGE_AMOUNT, 6));
			await stable.connect(user).approve(pool, parseUnits(HUGE_AMOUNT, 18));
			await pool
				.connect(user)
				['add_liquidity(uint256[],uint256)']([parseUnits(HUGE_AMOUNT, 6), parseUnits(HUGE_AMOUNT, 18)], 0n);
			await showDetails();
		});

		it('Curator redeems liquidity', async function () {
			const balanceBefore = await stable.balanceOf(curator);
			const adapterLP = await pool.balanceOf(adapter);

			await adapter.connect(curator).redeem(adapterLP, 0n);

			const balanceAfter = await stable.balanceOf(curator);

			console.log('Revenue', formatUnits(balanceAfter - balanceBefore, 18));

			await showDetails();
		});
	});
});
