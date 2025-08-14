// Sources flattened with hardhat v2.26.2 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/access/Ownable2Step.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (access/Ownable2Step.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This extension of the {Ownable} contract includes a two-step mechanism to transfer
 * ownership, where the new owner must call {acceptOwnership} in order to replace the
 * old one. This can help prevent common mistakes, such as transfers of ownership to
 * incorrect accounts, or to contracts that are unable to interact with the
 * permission system.
 *
 * The initial owner is specified at deployment time in the constructor for `Ownable`. This
 * can later be changed with {transferOwnership} and {acceptOwnership}.
 *
 * This module is used through inheritance. It will make available all functions
 * from parent (Ownable).
 */
abstract contract Ownable2Step is Ownable {
    address private _pendingOwner;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Returns the address of the pending owner.
     */
    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner;
    }

    /**
     * @dev Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one.
     * Can only be called by the current owner.
     *
     * Setting `newOwner` to the zero address is allowed; this can be used to cancel an initiated ownership transfer.
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner(), newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`) and deletes any pending owner.
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual override {
        delete _pendingOwner;
        super._transferOwnership(newOwner);
    }

    /**
     * @dev The new owner accepts the ownership transfer.
     */
    function acceptOwnership() public virtual {
        address sender = _msgSender();
        if (pendingOwner() != sender) {
            revert OwnableUnauthorizedAccount(sender);
        }
        _transferOwnership(sender);
    }
}


// File @openzeppelin/contracts/interfaces/draft-IERC6093.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/draft-IERC6093.sol)
pragma solidity >=0.8.4;

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity >=0.6.2;

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// File @openzeppelin/contracts/token/ERC20/ERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.20;




/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}


// File contracts/MINEDTokenStandalone.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity 0.8.30;

// Compiler settings for maximum size optimization
// solc-optimize: true
// solc-optimize-runs: 1
// solc-via-ir: true


/**
 * @title OptimizedMINEDToken
 * @dev Ultra-compact Hybrid PoW/PoS Mathematical Discovery Token
 */
contract OptimizedMINEDToken is ERC20, Ownable2Step {
    
    // ============ CONSTANTS ============
    uint256 private constant INITIAL_SUPPLY = 1e27;
    uint256 private constant INITIAL_EMISSION = 1e21;
    uint256 private constant MIN_VALIDATOR_STAKE = 2e22;
    
    uint16 private constant BASE_BURN = 1000;
    uint16 private constant MILLENNIUM_BURN = 2500;
    uint16 private constant MAJOR_BURN = 1500;
    uint16 private constant COLLAB_BURN = 1200;
    
    uint16 private constant BEGINNER_MUL = 1000;
    uint16 private constant INTERMEDIATE_MUL = 2500;
    uint16 private constant ADVANCED_MUL = 5000;
    uint16 private constant EXPERT_MUL = 10000;
    
    uint16 private constant MILLENNIUM_SIG = 25000;
    uint16 private constant MAJOR_SIG = 15000;
    uint16 private constant COLLAB_SIG = 3000;
    
    // ============ STATE ============
    struct PackedState {
        uint128 totalBurned;
        uint128 totalResearchValue;
        uint64 lastEmissionBlock;
        uint32 totalValidators;
        uint32 nextDiscoveryId;
    }
    
    PackedState public state;
    uint8 public maxWorkType = 24;
    
    // ============ STRUCTS ============
    struct Validator {
        uint128 stakedAmount;
        uint64 totalValidations;
        uint32 reputation;
        uint32 registrationTime;
        bool isActive;
    }
    
    struct Discovery {
        uint128 researchValue;
        uint64 timestamp;
        uint32 validationCount;
        uint16 complexity;
        uint8 significance;
        uint8 workType;
        address researcher;
        bool isValidated;
        bool isCollaborative;
    }
    
    struct ValidationRequest {
        uint128 fee;
        uint64 requestTime;
        uint32 discoveryId;
        uint16 consensusCount;
        bool isCompleted;
    }
    
    struct WorkTypeInfo {
        uint16 difficultyMultiplier;
        uint16 baseReward;
        bool isActive;
    }
    
    // ============ MAPPINGS ============
    mapping(address => Validator) public validators;
    mapping(uint32 => Discovery) public discoveries;
    mapping(uint32 => ValidationRequest) public validationRequests;
    mapping(address => uint256) public stakingInfo;
    mapping(address => uint256) public researchContributions;
    mapping(uint32 => mapping(address => bool)) public hasValidated;
    mapping(uint8 => WorkTypeInfo) public workTypes;
    
    // ============ EVENTS ============
    event ValidatorRegistered(address indexed validator, uint256 stake);
    event ValidatorSlashed(address indexed validator, uint256 amount);
    event DiscoverySubmitted(uint32 indexed id, address indexed researcher, uint8 workType, uint256 value);
    event ValidationRequested(uint32 indexed requestId, uint32 indexed discoveryId, uint256 fee);
    event DiscoveryValidated(uint32 indexed discoveryId, address indexed validator, bool consensus);
    event SecurityFeedback(uint32 indexed discoveryId, uint256 securityEnhancement);
    event TokensBurned(address indexed from, uint256 amount);
    event WorkTypeAdded(uint8 indexed workType);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);
    event WorkTypeUpdated(uint8 indexed workType, bool isActive);
    event ValidatorUnregistered(address indexed validator);
    event EmissionMinted(address indexed to, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    constructor(address holder) payable ERC20("MINED", "MINED") Ownable(holder) {
        require(holder != address(0), "Invalid holder");
        _mint(holder, INITIAL_SUPPLY);
        
        state.lastEmissionBlock = uint64(block.number);
        state.totalBurned = 1;
        state.totalResearchValue = 1;
        state.nextDiscoveryId = 1;
        
        _initWorkTypes();
    }
    
    // ============ VALIDATOR FUNCTIONS ============
    
    function registerValidator() external {
        uint256 minStake = MIN_VALIDATOR_STAKE;
        require(balanceOf(msg.sender) > minStake - 1, "Insufficient balance");
        require(!validators[msg.sender].isActive, "Already registered");
        
        address contractAddr = address(this);
        _transfer(msg.sender, contractAddr, minStake);
        
        Validator storage validator = validators[msg.sender];
        validator.stakedAmount = uint128(minStake);
        validator.totalValidations = 0;
        validator.reputation = 1000;
        validator.registrationTime = uint32(block.timestamp);
        validator.isActive = true;
        
        unchecked { ++state.totalValidators; }
        emit ValidatorRegistered(msg.sender, minStake);
    }
    
    function unregisterValidator() external {
        Validator storage validator = validators[msg.sender];
        require(validator.isActive, "Not registered");
        
        uint256 stakedAmount = validator.stakedAmount;
        address contractAddr = address(this);
        _transfer(contractAddr, msg.sender, stakedAmount);
        delete validators[msg.sender];
        unchecked { --state.totalValidators; }
        emit ValidatorUnregistered(msg.sender);
    }
    
    function slashValidator(address validatorAddr, uint256 amount) external payable onlyOwner {
        require(validatorAddr != address(0), "Invalid validator");
        Validator storage v = validators[validatorAddr];
        require(v.isActive, "Not active");
        require(amount != 0, "Zero amount");
        require(amount < v.stakedAmount + 1, "Amount too high");
        
        address contractAddr = address(this);
        _burn(contractAddr, amount);
        
        unchecked {
            state.totalBurned += uint128(amount);
            v.stakedAmount -= uint128(amount);
            v.reputation = v.reputation >= 100 ? v.reputation - 100 : 0;
        }
        
        if (v.stakedAmount <= MIN_VALIDATOR_STAKE - 1) {
            v.isActive = false;
            unchecked { --state.totalValidators; }
        }
        
        emit ValidatorSlashed(validatorAddr, amount);
        emit TokensBurned(contractAddr, amount);
    }
    
    // ============ DISCOVERY FUNCTIONS ============
    
    function submitDiscovery(
        uint8 workType,
        uint8 complexity,
        uint8 significance,
        uint256 researchValue,
        bool isCollaborative
    ) external returns (uint32) {
        require(workType < maxWorkType + 1, "Invalid work type");
        require(workTypes[workType].isActive, "Work type inactive");
        require(complexity != 0, "Zero complexity");
        require(complexity < 11, "Complexity too high");
        require(significance != 0, "Zero significance");
        require(significance < 4, "Significance too high");
        require(researchValue != 0, "Zero research value");
        
        uint32 discoveryId = state.nextDiscoveryId++;
        
        Discovery storage discovery = discoveries[discoveryId];
        discovery.researchValue = uint128(researchValue);
        discovery.timestamp = uint64(block.timestamp);
        discovery.validationCount = 0;
        discovery.complexity = complexity;
        discovery.significance = significance;
        discovery.workType = workType;
        discovery.researcher = msg.sender;
        discovery.isValidated = false;
        discovery.isCollaborative = isCollaborative;
        
        uint256 reward = _calcReward(workType, complexity, significance, researchValue, isCollaborative);
        uint256 burnAmount = _calcBurn(significance, isCollaborative, reward);
        
        _mint(msg.sender, reward - burnAmount);
        if (burnAmount != 0) {
            _burn(msg.sender, burnAmount);
            unchecked { state.totalBurned += uint128(burnAmount); }
        }
        
        unchecked {
            state.totalResearchValue += uint128(researchValue);
            researchContributions[msg.sender] += researchValue;
        }
        
        emit DiscoverySubmitted(discoveryId, msg.sender, workType, researchValue);
        return discoveryId;
    }
    
    function requestValidation(uint32 discoveryId, uint256 fee) external returns (uint32) {
        require(discoveries[discoveryId].researcher != address(0), "Discovery not found");
        require(fee > 1e18 - 1, "Fee too low");
        require(balanceOf(msg.sender) > fee - 1, "Insufficient balance");
        
        _burn(msg.sender, fee);
        unchecked { state.totalBurned += uint128(fee); }
        
        uint32 requestId = uint32(block.timestamp);
        ValidationRequest storage request = validationRequests[requestId];
        request.fee = uint128(fee);
        request.requestTime = uint64(block.timestamp);
        request.discoveryId = discoveryId;
        request.consensusCount = 0;
        request.isCompleted = false;
        
        emit ValidationRequested(requestId, discoveryId, fee);
        return requestId;
    }
    
    function validateDiscovery(uint32 requestId, bool isValid) external {
        require(validators[msg.sender].isActive, "Not validator");
        require(!hasValidated[requestId][msg.sender], "Already validated");
        
        ValidationRequest storage request = validationRequests[requestId];
        require(!request.isCompleted, "Request completed");
        
        Discovery storage discovery = discoveries[request.discoveryId];
        hasValidated[requestId][msg.sender] = true;
        
        if (isValid) {
            unchecked {
                ++request.consensusCount;
                ++validators[msg.sender].totalValidations;
            }
        }
        
        uint256 requiredConsensus = (state.totalValidators << 1) / 3 + 1;
        
        if (request.consensusCount >= requiredConsensus) {
            request.isCompleted = true;
            discovery.isValidated = true;
            discovery.validationCount = request.consensusCount;
            
            uint256 securityEnhancement = discovery.researchValue * discovery.complexity;
            emit SecurityFeedback(request.discoveryId, securityEnhancement);
            
            uint256 reward = (request.fee * 500) / 10000;
            _mint(msg.sender, reward);
        }
        
        emit DiscoveryValidated(request.discoveryId, msg.sender, request.consensusCount >= requiredConsensus);
    }
    
    // ============ EMISSION & STAKING ============
    
    function calculateEmission() public view returns (uint256 emission) {
        uint256 cachedLastBlock = state.lastEmissionBlock;
        uint256 cachedResearchValue = state.totalResearchValue;
        
        uint256 currentBlock = _getCurrentBlockNumber();
        uint256 blockDelta = currentBlock - cachedLastBlock;
        uint256 decay = blockDelta >= 10000 ? 1 : 10000 - blockDelta;
        uint256 research = cachedResearchValue != 1 ? cachedResearchValue - 1 : 0;
        
        uint256 researchMultiplier = 10000 + (research >> 15);
        emission = (INITIAL_EMISSION * decay * researchMultiplier) / 1e8;
    }
    
    // L2 compatibility: use ArbSys for Arbitrum, block.number for others
    function _getCurrentBlockNumber() internal view returns (uint256) {
        (bool success, bytes memory data) = address(100).staticcall(
            abi.encodeWithSignature("arbBlockNumber()")
        );
        
        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        
        return block.number;
    }
    
    function mintEmission(address to) external payable onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 emission = calculateEmission();
        if (emission != 0) {
            _mint(to, emission);
            state.lastEmissionBlock = uint64(_getCurrentBlockNumber());
            emit EmissionMinted(to, emission);
        }
    }
    
    function stakeTokens(uint256 amount) external {
        require(amount != 0, "Zero amount");
        require(balanceOf(msg.sender) > amount - 1, "Insufficient balance");
        
        address contractAddr = address(this);
        _transfer(msg.sender, contractAddr, amount);
        unchecked { stakingInfo[msg.sender] += amount; }
        emit TokensStaked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external {
        require(amount != 0, "Zero amount");
        require(stakingInfo[msg.sender] > amount - 1, "Insufficient staked");
        
        unchecked { stakingInfo[msg.sender] -= amount; }
        uint256 reward = (amount * 8) / 100;
        
        address contractAddr = address(this);
        _transfer(contractAddr, msg.sender, amount);
        if (reward != 0) _mint(msg.sender, reward);
        emit TokensUnstaked(msg.sender, amount, reward);
    }
    
    // ============ WORK TYPE MANAGEMENT ============
    
    function addWorkType(uint8 workType, uint16 difficultyMultiplier, uint16 baseReward) external payable onlyOwner {
        require(workType > maxWorkType, "Invalid work type");
        require(difficultyMultiplier != 0, "Zero multiplier");
        
        workTypes[workType] = WorkTypeInfo({
            difficultyMultiplier: difficultyMultiplier,
            baseReward: baseReward,
            isActive: true
        });
        
        maxWorkType = workType;
        emit WorkTypeAdded(workType);
    }
    
    function updateWorkType(uint8 workType, bool isActive) external payable onlyOwner {
        require(workType < maxWorkType + 1, "Invalid work type");
        WorkTypeInfo storage workTypeInfo = workTypes[workType];
        if (workTypeInfo.isActive != isActive) {
            workTypeInfo.isActive = isActive;
            emit WorkTypeUpdated(workType, isActive);
        }
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _calcReward(uint8 workType, uint8 complexity, uint8 significance, uint256 researchValue, bool isCollab) 
        internal view returns (uint256) {
        
        WorkTypeInfo storage workInfo = workTypes[workType];
        uint256 complexityMul = workInfo.difficultyMultiplier != 0 ? workInfo.difficultyMultiplier :
                               (complexity <= 3 ? BEGINNER_MUL :
                                complexity <= 6 ? INTERMEDIATE_MUL :
                                complexity <= 8 ? ADVANCED_MUL : EXPERT_MUL);
                               
        uint256 sigMul = significance == 3 ? MILLENNIUM_SIG :
                        significance == 2 ? MAJOR_SIG :
                        isCollab ? COLLAB_SIG : 1000;
        
        return (INITIAL_EMISSION * complexityMul * sigMul * researchValue) / 1e12;
    }
    
    function _calcBurn(uint8 significance, bool isCollab, uint256 reward) 
        internal pure returns (uint256) {
        uint256 burnRate = significance == 3 ? MILLENNIUM_BURN :
                          significance == 2 ? MAJOR_BURN :
                          isCollab ? COLLAB_BURN : BASE_BURN;
        
        return (reward * burnRate) / 10000;
    }
    
    function _initWorkTypes() private {
        // Compact initialization - only essential data
        workTypes[0] = WorkTypeInfo(10000, 1000, true); // Riemann
        workTypes[1] = WorkTypeInfo(8000, 750, true);   // Goldbach
        workTypes[2] = WorkTypeInfo(8000, 700, true);   // Birch-Swinnerton
        workTypes[3] = WorkTypeInfo(6000, 500, true);   // Prime Pattern
        workTypes[4] = WorkTypeInfo(8000, 650, true);   // Twin Primes
        workTypes[5] = WorkTypeInfo(6000, 600, true);   // Collatz
        workTypes[6] = WorkTypeInfo(8000, 720, true);   // Perfect Numbers
        workTypes[7] = WorkTypeInfo(10000, 1000, true); // Mersenne
        workTypes[8] = WorkTypeInfo(4000, 450, true);   // Fibonacci
        workTypes[9] = WorkTypeInfo(4000, 400, true);   // Pascal
        workTypes[10] = WorkTypeInfo(8000, 760, true);  // Differential
        workTypes[11] = WorkTypeInfo(6000, 640, true);  // Number Theory
        workTypes[12] = WorkTypeInfo(10000, 900, true); // Yang-Mills
        workTypes[13] = WorkTypeInfo(10000, 850, true); // Navier-Stokes
        workTypes[14] = WorkTypeInfo(6000, 550, true);  // ECC
        workTypes[15] = WorkTypeInfo(10000, 800, true); // Lattice
        workTypes[16] = WorkTypeInfo(6000, 680, true);  // Crypto Hash
        workTypes[17] = WorkTypeInfo(10000, 950, true); // Poincare
        workTypes[18] = WorkTypeInfo(10000, 920, true); // Algebraic Topology
        workTypes[19] = WorkTypeInfo(6000, 560, true);  // Euclidean
        workTypes[20] = WorkTypeInfo(10000, 1100, true); // Quantum
        workTypes[21] = WorkTypeInfo(8000, 840, true);  // ML
        workTypes[22] = WorkTypeInfo(6000, 600, true);  // Blockchain
        workTypes[23] = WorkTypeInfo(6000, 560, true);  // Distributed
        workTypes[24] = WorkTypeInfo(8000, 760, true);  // Optimization
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getSystemInfo() external view returns (
        uint256 totalSupply_,
        uint256 totalBurned_,
        uint256 totalResearchValue_,
        uint256 totalValidators_,
        uint256 currentEmission
    ) {
        uint256 cachedTotalBurned = state.totalBurned;
        uint256 cachedTotalResearchValue = state.totalResearchValue;
        
        return (
            totalSupply(),
            cachedTotalBurned != 1 ? cachedTotalBurned - 1 : 0,
            cachedTotalResearchValue != 1 ? cachedTotalResearchValue - 1 : 0,
            state.totalValidators,
            calculateEmission()
        );
    }
    
    function getValidatorInfo(address validator) external view returns (
        uint256 stakedAmount,
        uint256 validations,
        uint256 reputation,
        bool isActive
    ) {
        Validator storage v = validators[validator];
        return (v.stakedAmount, v.totalValidations, v.reputation, v.isActive);
    }
    
    function getDiscovery(uint32 discoveryId) external view returns (
        address researcher,
        uint8 workType,
        uint8 complexity,
        uint8 significance,
        uint256 researchValue,
        bool isValidated,
        uint256 validationCount
    ) {
        Discovery storage d = discoveries[discoveryId];
        return (d.researcher, d.workType, uint8(d.complexity), d.significance, 
                uint256(d.researchValue), d.isValidated, uint256(d.validationCount));
    }
    
    function getWorkTypeInfo(uint8 workType) external view returns (
        uint16 difficultyMultiplier,
        uint16 baseReward,
        bool isActive
    ) {
        require(workType < maxWorkType + 1, "Invalid work type");
        WorkTypeInfo storage info = workTypes[workType];
        return (info.difficultyMultiplier, info.baseReward, info.isActive);
    }
}
