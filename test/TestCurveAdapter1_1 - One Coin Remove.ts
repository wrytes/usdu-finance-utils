import { ethers, network } from 'hardhat';
import { ICurveAdapterV1_1, ICurveStableSwapNG, IERC20, Stablecoin } from '../typechain';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { formatUnits, parseEther, parseUnits } from 'viem';
import { ADDRESS } from '@usdu-finance/usdu-core';
import { mainnet } from 'viem/chains';
import { evm_increaseTime } from './helper';

const addr = ADDRESS[mainnet.id];

describe('ICurveAdapterV1_1: One Coin Remove Tests', function () {
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
	const TRADE_AMOUNT = '1586';

	let inputUSDC: bigint;

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
						blockNumber: 25201488, // Set your desired block number here
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

	describe('One Coin Remove Tests', function () {
		it('User approves and deposits USDC via adapter', async function () {
			inputUSDC = parseUnits(TRADE_AMOUNT, 6);

			await usdc.connect(user).approve(adapter, inputUSDC);
			// adapter.addLiquidity(amount, minShares) — deposits USDC and mints LP shares into adapter
			await adapter.connect(user).addLiquidity(inputUSDC, 0n);

			console.log('Input USDC:', formatUnits(inputUSDC, 6));

			await showDetails();
		});

		it('User removes liquidity one-coin to USDC', async function () {
			const userLP = await pool.balanceOf(user);

			const usdcBefore = await usdc.balanceOf(user.address);

			// coin index 0 = USDC, index 1 = USDU — verify against pool.coins(0) if uncertain
			await pool.connect(user)['remove_liquidity_one_coin(uint256,int128,uint256)'](userLP, 0n, 0n);

			const usdcAfter = await usdc.balanceOf(user.address);
			const outputUSDC = usdcAfter - usdcBefore;

			console.log('Input USDC: ', formatUnits(inputUSDC, 6));
			console.log('Output USDC:', formatUnits(outputUSDC, 6));

			await showDetails();
		});
	});
});
