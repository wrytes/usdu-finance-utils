// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20, IERC20Metadata} from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import {ICurveStableSwapNG} from './ICurveStableSwapNG.sol';

interface ICurveAdapterV1_1 {
	// Custom Errors
	error AlreadyPending();
	error ImbalancedVariant(uint256[] balances);
	error NoPendingValue();
	error NotProfitable();
	error SafeERC20FailedOperation(address token);
	error TimelockNotElapsed();

	// Events
	event AddLiquidity(
		address indexed sender,
		uint256 minted,
		uint256 totalMinted,
		uint256 sharesMinted,
		uint256 totalShares
	);

	event Distribution(address indexed receiver, uint256 amount, uint256 ratio);

	event RemoveLiquidity(
		address indexed sender,
		uint256 burned,
		uint256 totalMinted,
		uint256 sharesBurned,
		uint256 totalShares
	);

	event Revenue(uint256 amount, uint256 totalRevenue, uint256 totalMinted);

	event RevokeDistribution(address indexed caller);

	event SetDistribution(address indexed caller);

	event SubmitDistribution(address indexed caller, address[5] receivers, uint32[5] weights, uint256 timelock);

	// Functions
	function addLiquidity(uint256 amount, uint256 minShares) external returns (uint256);

	function applyDistribution() external;

	function calcProfitability(uint256 beforeLP, uint256 afterLP, uint256 split) external view returns (uint256);

	function checkImbalance() external view returns (bool);

	function coin() external view returns (IERC20Metadata);

	function idxC() external view returns (uint256);

	function idxS() external view returns (uint256);

	function payOffDebt() external;

	function pendingReceivers(uint256) external view returns (address);

	function pendingValidAt() external view returns (uint256);

	function pendingWeights(uint256) external view returns (uint32);

	function pool() external view returns (ICurveStableSwapNG);

	function receivers(uint256) external view returns (address);

	function redeem(uint256 shares, uint256 minAmount) external;

	function removeLiquidity(uint256 shares, uint256 minAmount) external returns (uint256);

	function revokePendingDistribution() external;

	function setDistribution(address[5] memory _receivers, uint32[5] memory _weights) external;

	function stable() external view returns (IERC20);

	function totalMinted() external view returns (uint256);

	function totalRevenue() external view returns (uint256);

	function totalWeights() external view returns (uint256);

	function verifyImbalance(bool state) external view;

	function weights(uint256) external view returns (uint32);
}
