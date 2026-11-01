# Architecture v2

## Overview

Version 2 keeps the block explorer from v1 and adds a second navigation area called **Account Explorer**. React Router now coordinates two learning paths:

- **Block Explorer:** recent blocks, block details, and transaction details.
- **Account Explorer:** address search, account summary, contract status, and recent asset transfers.

The application is still a browser-only React client. Alchemy SDK provides Ethereum Mainnet reads, so private keys, signing, and server-side state are not part of this architecture.

## Application Structure

`BrowserRouter` wraps the application. A shared header contains links to the two explorer tabs. The route table is:

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `LatestBlocks` | Displays the latest block number and ten recent blocks. |
| `/block/:blockNumber` | `BlockDetails` | Displays block metadata and all transactions. |
| `/tx/:transactionHash` | `TransactionDetails` | Displays transaction and receipt details. |
| `/accounts` | `AccountExplorer` | Validates an address and starts an account lookup. |
| `/account/:address` | `AccountDetails` | Displays account and transfer data. |

`ExplorerTabs` reads the current location and marks Block Explorer or Account Explorer as active. This keeps the correct tab highlighted across block, transaction, account search, and account detail routes.

## Block Explorer Request Flow

1. The `/` page calls `Alchemy.core.getBlockNumber()`.
2. The page requests the current block and nine preceding blocks with `Alchemy.core.getBlock()`.
3. A block link navigates to `/block/:blockNumber`.
4. The block page calls `Alchemy.core.getBlockWithTransactions(identifier)`.
5. A transaction link navigates to `/tx/:transactionHash`.
6. The transaction page calls `Alchemy.core.getTransaction(hash)` and `Alchemy.core.getTransactionReceipt(hash)`.

The block and transaction screens share the existing loading, error, formatting, detail-list, and responsive styles.

## Account Explorer Request Flow

1. The user opens `/accounts`.
2. `AccountExplorer` validates the address with a regular expression requiring `0x` followed by exactly 40 hexadecimal characters.
3. A valid lookup navigates to `/account/:address`.
4. `AccountDetails` calls five independent Alchemy reads in parallel:
   - `getBalance(address)`
   - `getTransactionCount(address)`
   - `getCode(address)`
   - `getAssetTransfers({ toAddress: address })`
   - `getAssetTransfers({ fromAddress: address })`
5. The balance is converted from wei to a display value in ETH.
6. Contract bytecode is used to classify the address as either a contract or an externally owned account.
7. `lookupAddress(address)` performs an ENS reverse lookup for a configured primary name. A failed lookup or null result is shown as no primary name configured.
8. Incoming and outgoing transfers are combined, deduplicated by transfer key, sorted, and presented as links to transaction details.

## Components and State

The implementation keeps route-specific requests inside page components. The major account states are:

- loading while Alchemy requests are in progress;
- invalid-address or request errors;
- a successful account summary; and
- an empty result when no recent asset transfers are available.

Each effect tracks whether the component remains mounted. Cleanup prevents late network responses from updating a page after navigation.

## Response Data Model

The account view combines several data shapes:

- `getBalance` returns a wei balance.
- `getTransactionCount` returns the account nonce.
- `getCode` returns contract bytecode or `0x`.
- `getAssetTransfers` returns external, ERC-20, ERC-721, and ERC-1155 transfer records.
- Transfer records use Alchemy's normalized fields for category, asset, sender, recipient, value, transaction hash, and block number.

Formatting functions keep raw values available for request links while presentation fields remain readable. Hashes, wei balances, block numbers, timestamps, and contract code are shortened or converted only for display.

## Styling

`src/App.css` provides:

- the shared header and two-tab navigation;
- the account-address search form;
- reusable account/detail cards;
- asset-transfer rows that link to transaction pages;
- primary ENS names resolved from account addresses; and
- mobile layouts for the header, form, detail values, and transfer records.

## Future Extension Points

The account architecture can grow into additional features without changing the core block routes:

- Forward ENS resolution for names such as `vitalik.eth`.
- Direct ERC-20 token balances.
- Pagination for account transfer history.
- NFT metadata and collection views.
- Address and transaction copy controls.
- Server-side API proxying for production credentials.
