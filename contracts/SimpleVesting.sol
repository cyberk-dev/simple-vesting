// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vesting Contract
 * @author Kanz
 * @notice A smart contract that enables users to claim USD tokens according to predefined vesting schedules
 * @dev Supports multiple USD tokens (USDC, DAI, USDT, etc.) with flexible vesting configurations
 *
 * Key Features:
 * - Multi-token support with automatic decimal scaling
 * - Configurable release timepoints for each user
 * - Admin-controlled configuration and start process
 * - Anyone can fund the contract by direct token transfers
 *
 * Usage Flow:
 * 1. Owner configures supported tokens and user vesting schedules
 * 2. Owner starts the vesting process (configuration becomes immutable)
 * 3. Users can claim their vested tokens at configured release times
 * 4. Admin can withdraw remaining tokens after vesting period ends
 */
contract SimpleVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    /// @notice Array of supported USD token contracts (USDC, DAI, USDT, etc.)
    IERC20Metadata[] public supportedUsdTokens;

    /// @notice Array of timestamps when tokens become claimable for users
    uint256[] public releaseTimes;

    /// @notice Mapping of user address to release time to claimable amount (in 18 decimals)
    /// @dev userTimeAmounts[user][time] = amount
    mapping(address user => mapping(uint256 time => uint256 amount)) public userTimeAmounts;

    /// @notice Total amount already claimed by each user (in 18 decimals)
    mapping(address user => uint256 amount) public userClaimedAmounts;

    /// @notice Flag indicating if the vesting process has started
    /// @dev Once true, configuration cannot be modified
    bool public started;

    /// @notice Error thrown when no USD tokens are configured
    error NoUsdToken();
    /// @notice Error thrown when trying to call a function that requires vesting to be started
    error NotStarted();
    /// @notice Error thrown when trying to call a function that requires vesting to not be started
    error Started();
    /// @notice Error thrown when no release times are configured
    error NoReleaseTime();
    /// @notice Error thrown when release times are not in ascending order
    error NotAscendingTime();
    /// @notice Error thrown when user has no tokens to claim
    error NoClaimableAmount();
    /// @notice Error thrown when vesting period hasn't ended yet
    error NotEnded();
    /// @notice Error thrown when token decimals are invalid
    error InvalidTokenDecimals();

    /// @notice Modifier to ensure function can only be called after vesting has started
    modifier onlyStarted() {
        if (!started) revert NotStarted();
        _;
    }

    /// @notice Modifier to ensure function can only be called before vesting has started
    modifier onlyNotStarted() {
        if (started) revert Started();
        _;
    }

    /// @notice Constructor initializes the contract with the deployer as owner
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Allows users to claim their vested tokens
     * @dev Calls claimUser internally with msg.sender
     */
    function claim() external {
        claimUser(msg.sender);
    }

    /**
     * @notice Claims vested tokens for a specific user
     * @dev Distributes tokens across all supported USD tokens proportionally
     * @dev Automatically handles different token decimals by scaling to 18 decimals
     * @param _user Address of the user to claim tokens for
     * @custom:modifier onlyStarted
     * @custom:modifier nonReentrant
     */
    function claimUser(address _user) public onlyStarted nonReentrant {
        uint256 claimableAmount = getUserClaimableAmount(_user);
        if (claimableAmount == 0) revert NoClaimableAmount();
        uint256 sentAmount = 0;
        for (uint256 i = 0; i < supportedUsdTokens.length; i++) {
            IERC20Metadata token = supportedUsdTokens[i];
            uint256 precision = 10 ** (18 - token.decimals()); // safe, we checked decimals in setSupportedUsdTokens
            uint256 contractBalance = token.balanceOf(address(this)) * precision; // scale all tokens to 18 decimals
            if (contractBalance < claimableAmount) {
                sentAmount += contractBalance;
                token.safeTransfer(_user, contractBalance / precision); // scale back to token decimals
                claimableAmount -= contractBalance;
            } else {
                sentAmount += claimableAmount;
                token.safeTransfer(_user, claimableAmount / precision); // scale back to token decimals
                claimableAmount = 0;
                break;
            }
        }
        userClaimedAmounts[_user] += sentAmount;
    }

    /**
     * @notice Calculates the total amount of tokens a user can claim at the current time
     * @dev Iterates through release times up to current timestamp
     * @param _user Address of the user to check claimable amount for
     * @return Total claimable amount in 18 decimals
     */
    function getUserClaimableAmount(address _user) public view returns (uint256) {
        uint256 totalAmount = 0;
        uint256 timestamp = block.timestamp;
        // safe, releaseTimes is very small
        for (uint256 i = 0; i < releaseTimes.length; ) {
            uint256 time = releaseTimes[i];
            if (timestamp >= time) {
                unchecked {
                    totalAmount += userTimeAmounts[_user][time];
                }
            } else {
                break;
            }
            unchecked {
                ++i;
            }
        }
        return totalAmount - userClaimedAmounts[_user];
    }

    /**
     * @notice Returns the vesting information for a user
     * @dev Returns the release times and claimable amounts for each supported USD token
     * @param _user Address of the user to check vesting information for
     * @return 2D array where [i][0] is the release time and [i][1] is the claimable amount for token i
     */
    function getUserVestingInfo(address _user) external view returns (uint256[][] memory) {
        uint256[][] memory results = new uint256[][](supportedUsdTokens.length);
        for (uint256 i = 0; i < supportedUsdTokens.length; i++) {
            results[i] = new uint256[](2);
            results[i][0] = releaseTimes[i];
            results[i][1] = userTimeAmounts[_user][releaseTimes[i]];
        }
        return results;
    }

    /**
     * @notice Configures the vesting schedule for all users
     * @dev Clears existing configuration and sets new vesting parameters
     * @dev Release times must be in ascending order
     * @param _releaseTimes Array of timestamps when tokens become claimable
     * @param _users Array of user addresses eligible for vesting
     * @param _userTimeAmounts 2D array where [i][j] represents amount for user i at release time j (in 18 decimals)
     * @custom:modifier onlyOwner
     * @custom:modifier onlyNotStarted
     */
    function setConfig(
        uint256[] memory _releaseTimes,
        address[] memory _users,
        uint256[][] memory _userTimeAmounts // decimals 18 only
    ) external onlyOwner onlyNotStarted {
        delete releaseTimes;
        uint256 lastTime = 0;
        for (uint256 i = 0; i < _releaseTimes.length; i++) {
            uint256 time = _releaseTimes[i];
            if (time <= lastTime) {
                revert NotAscendingTime();
            }
            releaseTimes.push(time);
            lastTime = time;
        }
        for (uint256 i = 0; i < _users.length; i++) {
            for (uint256 j = 0; j < _releaseTimes.length; j++) {
                userTimeAmounts[_users[i]][_releaseTimes[j]] = _userTimeAmounts[i][j];
            }
        }
    }

    /**
     * @notice Starts the vesting process
     * @dev Once called, configuration cannot be modified
     * @dev Requires at least one supported USD token and release times configured
     * @custom:modifier onlyOwner
     * @custom:modifier onlyNotStarted
     */
    function start() external onlyOwner onlyNotStarted {
        if (supportedUsdTokens.length == 0) revert NoUsdToken();
        if (releaseTimes.length == 0) revert NoReleaseTime();
        started = true;
    }

    /**
     * @notice Configures which USD tokens the contract supports
     * @dev Replaces existing supported tokens with new list
     * @param _usdTokens Array of token contract addresses to support
     * @custom:modifier onlyOwner
     * @custom:modifier onlyNotStarted
     */
    function setSupportedUsdTokens(address[] memory _usdTokens) external onlyOwner onlyNotStarted {
        delete supportedUsdTokens;
        for (uint256 i = 0; i < _usdTokens.length; i++) {
            IERC20Metadata token = IERC20Metadata(_usdTokens[i]);
            if (token.decimals() > 18) revert InvalidTokenDecimals();
            supportedUsdTokens.push(token);
        }
    }

    /**
     * @notice Allows owner to withdraw any ETH from the contract
     * @dev Transfers entire contract ETH balance to owner
     * @custom:modifier onlyOwner
     */
    function withdrawEth() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @notice Allows owner to withdraw specific tokens after vesting period ends
     * @dev Can only withdraw after last release time + 1 day
     * @param _token Address of the token to withdraw
     * @custom:modifier onlyOwner
     */
    function withdrawTokens(address _token) external onlyOwner {
        // admin can withdraw any tokens after finish
        if (block.timestamp < releaseTimes[releaseTimes.length - 1] + 1 days) revert NotEnded();
        IERC20Metadata token = IERC20Metadata(_token);
        token.safeTransfer(owner(), token.balanceOf(address(this)));
    }
}
