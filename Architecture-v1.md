# Architecture

## Overview

This project is a small Ethereum block explorer built with React. It first requests Ethereum Mainnet data from Alchemy, then presents it as a navigable interface with three levels of information:

- a list of recent blocks;
- details and transactions for a selected block; and
- details and logs for a selected transaction.

The application itself is small:

- `src/index.js` creates and mounts the React application.
- `src/App.js` defines the application routes, shared presentation helpers, and the recent-block, block-detail, and transaction-detail views.
- `src/App.css` and `src/index.css` provide styling.
- `public/index.html` provides the HTML element where React mounts the page.
- Alchemy SDK serves as the Ethereum API client.
- `react-scripts` provides the development, build, linting, and test toolchain.
- `react-router-dom` connects route parameters to the block and transaction pages.

## Application Structure

`BrowserRouter` wraps the application and selects a page from the URL. The current routes are:

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `LatestBlocks` | Displays the latest block number and up to ten recent blocks. |
| `/block/:blockNumber` | `BlockDetails` | Displays one block and its complete transaction list. |
| `/tx/:transactionHash` | `TransactionDetails` | Displays transaction and receipt information. |

This separation follows a simple React pattern: each route owns the data it needs, while reusable functions format timestamps, hashes, gas values, and detail fields consistently.

The application also uses a shared loading state, a shared error state, and route-specific cancel flags. The flags prevent an asynchronous request from updating state after its component has unmounted.

## Request Flow

1. `npm start` starts the Create React App development server.
2. The browser loads `http://localhost:3000`.
3. `src/index.js` renders `<App />` into the page.
4. React mounts `App` and `BrowserRouter`.
5. For `/`, `LatestBlocks` calls `Alchemy.core.getBlockNumber()` to find the current block.
6. It creates ten block numbers from the current block downward and calls `Alchemy.core.getBlock()` for each one.
7. React stores the returned blocks in component state and renders clickable rows in a table.
8. Selecting a block navigates to `/block/:blockNumber`. `BlockDetails` calls `Alchemy.core.getBlockWithTransactions(identifier)` to retrieve the block and its transactions.
9. Selecting a transaction navigates to `/tx/:transactionHash`. `TransactionDetails` calls both `Alchemy.core.getTransaction(hash)` and `Alchemy.core.getTransactionReceipt(hash)`.
10. React combines the transaction and receipt data, then displays status, addresses, gas information, confirmation data, contract information, and event logs when available.

The application does not run an Ethereum node. It sends requests through Alchemy, which operates the infrastructure used to query the Ethereum network.

## Why It Has Many Modules

The visible source tree is small, but `node_modules` contains the dependency trees used by the framework and tooling.

The declared dependencies in `package.json` include:

- **React and React DOM:** Component rendering and browser integration.
- **Alchemy SDK:** Ethereum network access and RPC helpers.
- **react-router-dom:** Routing support for the homepage, block-detail page, and transaction-detail page.
- **react-scripts:** Webpack, Babel, ESLint, development-server, build, and test support.
- **Testing Library packages:** Browser-like component testing and assertions.
- **web-vitals:** Client-side web performance measurement support.

The dependency declarations themselves bring in transitive dependencies. For example, a framework package may depend on networking, parsing, bundling, command-line, logging, and utility packages. These modules are mostly infrastructure rather than application features.

The browser does not download the entire contents of `node_modules` as a single flat module collection. A bundler selects and packages the modules used by the application for each bundle or browser request.

## Why Startup Takes Time

Running `npm start` starts much more than the web page:

1. The Create React App development server starts.
2. Webpack creates a development bundle.
3. Babel transforms modern and JSX JavaScript for the browser.
4. ESLint checks the source.
5. Source maps and development metadata are generated.
6. The server watches files for changes and rebuilds when files are saved.
7. The browser receives the resulting page from the local server.

Startup is commonly slowest on the first run because packages have to be installed and JavaScript caches have to be populated. Later runs are usually faster because caches are reused.

Startup can also be affected by:

- Antivirus scanning of `node_modules`.
- A slow disk or network-mounted project directory.
- A cold package cache.
- A large dependency tree.
- Limited CPU or memory.
- Previous development-server processes occupying port 3000.

The server starts separately from the Alchemy request. Development-server startup is responsible for preparing React's web application, while `alchemy.core.getBlockNumber()` is an API request made later in the browser.

## Effect Lifecycle and API Requests

Each page loads network data after React mounts:

- `LatestBlocks` uses `[]` because it should load once when the homepage mounts.
- `BlockDetails` uses the route parameter in its dependency array because navigation between blocks requires a fresh request.
- `TransactionDetails` does the same with the transaction hash.

For example, changing from one block route to another causes this effect dependency to change:

```jsx
useEffect(() => {
  // Load the block identified by blockNumber.
}, [blockNumber]);
```

Each effect also tracks whether its component is still mounted. It sets that flag to `false` during cleanup so a late Alchemy response cannot update an unmounted page.

Loading and error states are kept separately from the returned data. This lets the interface clearly distinguish four situations: data is loading, a request failed, a block has no transactions, or data has loaded successfully.

## Development Security

This project expects a client-side environment variable:

```sh
REACT_APP_ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
```

Because Create React App embeds `REACT_APP_*` variables into browser-delivered code, users can inspect this value in the built application. It is appropriate only for learning or limited-development usage with a key whose restrictions match the exercise.

A production application should keep privileged credentials on a server. The browser can call that server, or the application can use a restricted public credential and protect it with a domain allowlist and usage limits.

## Explorer Extension Points

The current architecture establishes reusable patterns that can support additional explorer features:

- Resolve ENS names or addresses and link to account pages.
- Search directly by block number, block hash, or transaction hash.
- Cache requested blockchain data to reduce duplicate API calls.
- Add pagination instead of the fixed ten-block homepage list.
- Display event-log decoding in a more readable form.
- Add account transaction and token history pages.

These features increase application size because each feature introduces interface state, loading/error handling, routing, presentation components, data normalization, and possibly caching or shared services. That additional code is normally proportional to what a complete explorer needs, not to React startup overhead itself.
