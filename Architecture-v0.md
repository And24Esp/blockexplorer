# Architecture

## Overview

This project is a small Ethereum block explorer built with React. In its starter form, it does one visible task: request the current Ethereum Mainnet block number from Alchemy and display it in a browser window.

The application itself is small:

- `src/index.js` creates and mounts the React application.
- `src/App.js` requests the current block number and displays it.
- `src/App.css` and `src/index.css` provide styling.
- `public/index.html` provides the HTML element where React mounts the page.
- Alchemy SDK serves as the Ethereum API client.
- `react-scripts` provides the development, build, linting, and test toolchain.

## Request Flow

1. `npm start` starts the Create React App development server.
2. The browser loads `http://localhost:3000`.
3. `src/index.js` renders `<App />` into the page.
4. React mounts `App` and runs its `useEffect`.
5. `App` uses `Alchemy.core.getBlockNumber()` to call an Alchemy RPC endpoint.
6. The block number returned by Ethereum is stored in component state.
7. React rerenders `App` and displays `Block Number: <value>`.

The application does not run an Ethereum node. It sends requests through Alchemy, which operates the infrastructure used to query the Ethereum network.

## Why It Has Many Modules

The visible source tree is small, but `node_modules` contains the dependency trees used by the framework and tooling.

The declared dependencies in `package.json` include:

- **React and React DOM:** Component rendering and browser integration.
- **Alchemy SDK:** Ethereum network access and RPC helpers.
- **react-router-dom:** Routing support, available for future explorer pages.
- **react-scripts:** Webpack, Babel, ESLint, development-server, build, and test support.
- **Testing Library packages:** Browser-like component testing and assertions.
- **web-vitals:** Client-side web-performance measurement support.

The dependency declarations themselves bring in transitive dependencies. For example, a framework package may depend on networking, parsing, bundling, column layout, logging, and utility packages. These modules are mostly infrastructure rather than application features.

The browser does not download the entire contents of `node_modules` as a single flat package. A bundler selects and packages the modules used by the application into the JavaScript bundle delivered to the browser.

## Why Startup Takes Time

Running `npm start` starts much more than the web page:

1. The Create React App development server starts.
2. Webpack creates a development bundle.
3. Babel transforms modern JavaScript and JSX.
4. ESLint checks source files while the development server runs.
5. Source maps and development metadata are generated.
6. The server watches project files and rebuilds after changes.
7. The browser receives the updated bundle.

Startup is commonly slowest on the first run because dependencies have to be installed and development caches have to be created. Later runs are usually faster because those caches already exist.

Startup can also be affected by:

- Antivirus scanning of `node_modules`.
- Disk or network-mounted filesystems.
- Limited CPU or memory.
- Previous development-server processes occupying port 3000.

The server starts separately from the Alchemy request. Development-server startup prepares React's application, while `alchemy.core.getBlockNumber()` is an API request made later in the browser.

## Effect Lifecycle and API Requests

`src/App.js` uses React state to hold the block number and an effect to fetch it after mounting:

```jsx
const [blockNumber, setBlockNumber] = useState();

useEffect(() => {
  async function getBlockNumber() {
    setBlockNumber(await alchemy.core.getBlockNumber());
  }

  getBlockNumber();
}, []);
```

The dependency array with `[]` means React runs the effect once after the initial mount. This prevents a new request from being made after every state update or unrelated render.

In the starter code, the effect originally omitted the dependency array. React would therefore run the effect after every render. Fetching inside that effect would set state, trigger another render, and repeat the request cycle, causing unnecessary API calls.

For future features, effects should also handle cleanup where applicable, such as canceling requests or unsubscribing from subscriptions when a component unmounts.

## Development Security

This project expects a client-side environment variable:

```sh
REACT_APP_ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
```

Because Create React App embeds `REACT_APP_*` variables into browser-delivered code, users can inspect this value in the built application. It is appropriate only for learning or limited-development usage with a key whose restrictions match the exercise.

In a production application, privileged credentials should remain on a server. The browser can call a server endpoint instead, or use a restricted public credential protected by an appropriate domain allowlist and usage limit.

## Future Explorer Extension Points

The starter architecture can support an expanded block explorer through additional React components and Alchemy calls:

- Display block details with `alchemy.core.getBlock(...)`.
- List block transactions with `alchemy.core.getBlockWithTransactions(...)`.
- Display transaction details with `alchemy.core.getTransactionReceipt(...)`.
- Resolve ENS names or addresses.
- Add navigation between blocks, transactions, and accounts.
- Cache requested blockchain data to reduce duplicate API calls.
- Display loading, empty, rate-limit, and network error states.

These features increase application size because each feature introduces interface state, loading/error handling, routing, presentation components, data normalization, and possibly caching or shared services. The additional code is normally proportional to the explorer functionality being added, not to React startup overhead.
