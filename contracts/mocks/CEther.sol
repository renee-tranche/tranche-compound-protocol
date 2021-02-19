// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "../TransferETHHelper.sol";


contract CEther is OwnableUpgradeSafe, ERC20UpgradeSafe {
    using SafeMath for uint256;

    //uint256 internal exchangeRate;
    uint256 internal exchangeRateStoredVal;
    //uint256 internal supplyRate;
    uint256 public redeemPercentage;

    function initialize() public initializer {
        OwnableUpgradeSafe.__Ownable_init();
        ERC20UpgradeSafe.__ERC20_init_unchained("NewJNT", "NJNT");
        exchangeRateStoredVal = 200344979984441318958053512;
    }

    function mint() external payable returns (uint256) {
        _mint(msg.sender, msg.value.mul(10**28).div(exchangeRateStoredVal));
        return msg.value;
    }

    fallback() external payable {}
    receive() external payable {}

/*
    function setSupplyRatePerBlock(uint256 rate) external {
        supplyRate = rate;
    }

    function supplyRatePerBlock() external view returns (uint256) {
        return supplyRate;
    }
*/

    function setRedeemPercentage(uint256 _redeemPercentage) external {
        redeemPercentage = _redeemPercentage;
    }

    function redeem(uint redeemAmount) external returns (uint) {
        uint256 amount = redeemAmount.mul(exchangeRateStoredVal).div(10**28);

        TransferETHHelper.safeTransferETH(msg.sender, amount);

        return amount;
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        redeemFresh(msg.sender, 0, redeemAmount);
        //TransferETHHelper.safeTransferETH(msg.sender, redeemAmount);
        return 0;
    }

    function setExchangeRateStored(uint256 rate) external {
        exchangeRateStoredVal = rate;
    }

    function exchangeRateStored() public view returns (uint) {
        return exchangeRateStoredVal;
    }

    function doTransferOut(address payable to, uint amount) internal {
        /* Send the Ether, with minimal gas and revert on failure */
        to.transfer(amount);
    }

    /**
     * @notice User redeems cTokens in exchange for the underlying asset
     * @dev Assumes interest has already been accrued up to the current block
     * @param redeemer The address of the account which is redeeming the tokens
     * @param redeemTokensIn The number of cTokens to redeem into underlying (only one of redeemTokensIn or redeemAmountIn may be non-zero)
     * @param redeemAmountIn The number of underlying tokens to receive from redeeming cTokens (only one of redeemTokensIn or redeemAmountIn may be non-zero)
     */
    function redeemFresh(address payable redeemer, uint redeemTokensIn, uint redeemAmountIn) internal {
        require(redeemTokensIn == 0 || redeemAmountIn == 0, "one of redeemTokensIn or redeemAmountIn must be zero");

        uint256 redeemAmount;
        uint256 redeemTokens;
        /* exchangeRate = invoke Exchange Rate Stored() */
        uint256 exchangeRateMantissa = exchangeRateStored();

        /* If redeemTokensIn > 0: */
        if (redeemTokensIn > 0) {
            /*
             * We calculate the exchange rate and the amount of underlying to be redeemed:
             *  redeemTokens = redeemTokensIn
             *  redeemAmount = redeemTokensIn x exchangeRateCurrent
             */
            redeemTokens = redeemTokensIn;
            redeemAmount = exchangeRateMantissa.mul(redeemTokensIn).div(10**28);
        } else {
            /*
             * We get the current exchange rate and calculate the amount to be redeemed:
             *  redeemTokens = redeemAmountIn / exchangeRate
             *  redeemAmount = redeemAmountIn
             */

            redeemTokens = redeemAmountIn.mul(10**28).div(exchangeRateMantissa);
            redeemAmount = redeemAmountIn;
        }

        /* Verify market's block number equals current block number */
        /*if (accrualBlockNumber != getBlockNumber()) {
            return fail(Error.MARKET_NOT_FRESH, FailureInfo.REDEEM_FRESHNESS_CHECK);
        }*/

        /*
         * We calculate the new total supply and redeemer balance, checking for underflow:
         *  totalSupplyNew = totalSupply - redeemTokens
         *  accountTokensNew = accountTokens[redeemer] - redeemTokens
         */
        super._burn(redeemer, redeemTokens);

        /*
         * We invoke doTransferOut for the redeemer and the redeemAmount.
         *  Note: The cToken must handle variations between ERC-20 and ETH underlying.
         *  On success, the cToken has redeemAmount less of cash.
         *  doTransferOut reverts if anything goes wrong, since we can't be sure if side effects occurred.
         */
        doTransferOut(redeemer, redeemAmount);
    }
}
