// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from '@openzeppelin/contracts/utils/math/Math.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import {ICurveAdapterV1_1} from './helpers/ICurveAdapterV1_1.sol';
import {ICurveStableSwapNG} from './helpers/ICurveStableSwapNG.sol';

import {IMorpho} from './helpers/IMorpho.sol';
import {IMorphoFlashLoanCallback} from './helpers/IMorphoCallbacks.sol';

contract BalancerCurve is Ownable, IMorphoFlashLoanCallback {
	using Math for uint256;
	using SafeERC20 for IERC20;

	IMorpho private immutable morpho = IMorpho(0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb);
	ICurveStableSwapNG private pool = ICurveStableSwapNG(0x6C5Ff8DCe52BE77b4eCE6B51996018f0C1713bA9);
	ICurveAdapterV1_1 private adapter = ICurveAdapterV1_1(0x77cBb2f180F55dd2916bfC78F879A2C2dE37f638);

	IERC20 private usdu = IERC20(0xdde3eC717f220Fc6A29D6a4Be73F91DA5b718e55);
	IERC20 private usdc = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

	// events
	event Balanced(uint256 flashLoan, uint256 added, uint256 removed, uint256 swapped, uint256 revenue);

	// errors
	error NotMorpho();
	error Invalid();

	constructor(address _owner) Ownable(_owner) {}

	function execute(uint256 amount) external {
		morpho.flashLoan(address(usdc), amount, '');
	}

	function onMorphoFlashLoan(uint256 assets, bytes calldata data) external {
		if (msg.sender != address(morpho)) revert NotMorpho();

		usdc.approve(address(pool), assets);

		uint256[] memory amounts = new uint256[](2);
		amounts[0] = assets;
		amounts[1] = 0;
		uint256 receivedLP = pool.add_liquidity(amounts, 0);

		pool.approve(address(adapter), receivedLP);
		uint256 receivedUSDU = adapter.removeLiquidity(receivedLP, assets);

		usdu.approve(address(pool), receivedUSDU);
		uint256 receivedUSDC = pool.exchange(1, 0, receivedUSDU, assets);

		if (receivedUSDC <= assets) revert Invalid();
		uint256 revenue = receivedUSDC - assets;

		usdc.approve(address(morpho), assets);
		usdc.transfer(owner(), revenue);

		emit Balanced(assets, receivedLP, receivedUSDU, receivedUSDC, revenue);
	}
}
