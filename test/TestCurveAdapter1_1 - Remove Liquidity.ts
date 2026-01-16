import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ICurveAdapterV1_1, ICurveStableSwapNG, IERC20, Stablecoin } from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { parseEther, parseUnits, zeroAddress } from 'viem';
import { ADDRESS } from '@usdu-finance/usdu-core';
import { mainnet } from 'viem/chains';

const addr = ADDRESS[mainnet.id];

describe('CurveAdapterV1: Stablecoin Integration Tests', function () {
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
						blockNumber: 24244916, // Set your desired block number here
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

		// show init details
		await showDetails();
	});

	describe('Remove Liquidity Tests', function () {
		it('User adds USDC liquidity directly via the pool', async function () {
			await usdc.connect(user).approve(pool, parseUnits(TRADE_AMOUNT, 6));
			await pool.connect(user)['add_liquidity(uint256[],uint256)']([parseUnits(TRADE_AMOUNT, 6), 0n], 0n);

			await showDetails();
		});

		it('User removes LP with adapter', async function () {
			const userLP = await pool.balanceOf(user);

			await pool.connect(user).approve(adapter, userLP);
			await adapter.connect(user).removeLiquidity(userLP, 0n);

			await showDetails();
		});

		it('User swaps received USDU to USDC, regardless the imbalance', async function () {
			const userUSDU = await stable.balanceOf(user);

			await stable.connect(user).approve(pool, userUSDU);
			await pool.connect(user)['exchange(int128,int128,uint256,uint256)'](1n, 0n, userUSDU, 0n);

			await showDetails();
		});
	});
});
