import { Alchemy, Network } from 'alchemy-sdk';
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from 'react-router-dom';

import './App.css';

// Refer to the README doc for more information about using API
// keys in client-side code. You should never do this in production
// level code.
const settings = {
  apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};


// In this week's lessons we used ethers.js. Here we are using the
// Alchemy SDK is an umbrella library with several different packages.
//
// You can read more about the packages here:
//   https://docs.alchemy.com/reference/alchemy-sdk-api-surface-overview#api-surface
const alchemy = new Alchemy(settings);

const formatTimestamp = (timestamp) => {
  if (!timestamp && timestamp !== 0) return 'Unavailable';
  return new Date(timestamp * 1000).toLocaleString();
};

const formatGasUsed = (value) => {
  if (value === null || value === undefined) return 'Unavailable';
  return value.toString();
};

const formatHash = (hash) => {
  if (!hash) return 'Unavailable';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const formatEther = (value) => {
  if (value === null || value === undefined) return 'Unavailable';

  try {
    const wei = BigInt(value.toString());
    const whole = wei / 1000000000000000000n;
    const fraction = (wei % 1000000000000000000n)
      .toString()
      .padStart(18, '0')
      .replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole.toString();
  } catch {
    return value.toString();
  }
};

const formatBlockNumber = (blockNumber) => {
  if (!blockNumber) return 'Pending';
  if (typeof blockNumber === 'string' && blockNumber.startsWith('0x')) {
    return parseInt(blockNumber, 16).toLocaleString();
  }
  return blockNumber.toLocaleString ? blockNumber.toLocaleString() : blockNumber;
};

const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

function Loading({ message = 'Loading...' }) {
  return <div className="status-message">{message}</div>;
}

function ErrorMessage({ error }) {
  return (
    <div className="error-message" role="alert">
      {error}
    </div>
  );
}

function LatestBlocks() {
  const [latestBlock, setLatestBlock] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBlocks() {
      try {
        setLoading(true);
        setError('');
        const currentNumber = await alchemy.core.getBlockNumber();
        if (!active) return;
        setLatestBlock(currentNumber);

        const blockNumbers = Array.from({ length: 10 }, (_, index) => currentNumber - index);
        const blockDetails = await Promise.all(
          blockNumbers.map((number) => alchemy.core.getBlock(number))
        );

        if (active) setBlocks(blockDetails.filter(Boolean));
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load the latest blocks.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBlocks();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Ethereum Mainnet</p>
          <h1>Latest Blocks</h1>
        </div>
        {latestBlock !== null && (
          <div className="latest-block">
            Current block
            <strong>{latestBlock.toLocaleString()}</strong>
          </div>
        )}
      </section>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && (
        <div className="block-table-wrapper">
          <table className="block-table">
            <thead>
              <tr>
                <th>Block</th>
                <th>Timestamp</th>
                <th>Miner</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.hash || block.number}>
                  <td>
                    <Link className="block-link" to={`/block/${block.number}`}>
                      {block.number}
                    </Link>
                  </td>
                  <td>{formatTimestamp(block.timestamp)}</td>
                  <td className="hash-cell" title={block.miner}>
                    {formatHash(block.miner)}
                  </td>
                  <td>{block.transactions ? block.transactions.length : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function BlockDetails() {
  const { blockNumber } = useParams();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBlock() {
      try {
        setLoading(true);
        setError('');
        const identifier = /^0x/i.test(blockNumber)
          ? blockNumber
          : Number(blockNumber);
        const blockWithTransactions =
          await alchemy.core.getBlockWithTransactions(identifier);
        if (active) setBlock(blockWithTransactions);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load this block.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBlock();
    return () => {
      active = false;
    };
  }, [blockNumber]);

  return (
    <main className="page">
      <Link className="back-link" to="/">
        &larr; Latest blocks
      </Link>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && block && (
        <>
          <section className="page-heading">
            <div>
              <p className="eyebrow">Block</p>
              <h1>Block {block.number}</h1>
            </div>
          </section>

          <section className="detail-card">
            <dl className="detail-grid">
              <Detail label="Block hash" value={block.hash} />
              <Detail label="Parent hash" value={block.parentHash} />
              <Detail label="Timestamp" value={formatTimestamp(block.timestamp)} />
              <Detail label="Miner" value={block.miner} />
              <Detail label="Transaction count" value={block.transactions?.length || 0} />
              <Detail label="Gas used" value={formatGasUsed(block.gasUsed)} />
              <Detail label="Gas limit" value={formatGasUsed(block.gasLimit)} />
              <Detail label="Base fee" value={formatGasUsed(block.baseFeePerGas)} />
            </dl>
          </section>

          <section className="transactions-section">
            <h2>Transactions ({block.transactions?.length || 0})</h2>
            {!block.transactions?.length && (
              <div className="empty-message">This block has no transactions.</div>
            )}
            {block.transactions?.length > 0 && (
              <div className="transaction-list">
                {block.transactions.map((transaction) => (
                  <Link
                    className="transaction-row"
                    to={`/tx/${transaction.hash}`}
                    key={transaction.hash}
                  >
                    <span className="transaction-hash" title={transaction.hash}>
                      {formatHash(transaction.hash)}
                    </span>
                    <span>{transaction.from}</span>
                    <span>{transaction.to || 'Contract creation'}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{value ?? 'Unavailable'}</dd>
    </div>
  );
}

function TransactionDetails() {
  const { transactionHash } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTransaction() {
      try {
        setLoading(true);
        setError('');
        const [transactionResult, receiptResult] = await Promise.all([
          alchemy.core.getTransaction(transactionHash),
          alchemy.core.getTransactionReceipt(transactionHash),
        ]);
        if (active) {
          setTransaction(transactionResult);
          setReceipt(receiptResult);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load this transaction.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTransaction();
    return () => {
      active = false;
    };
  }, [transactionHash]);

  return (
    <main className="page">
      <Link className="back-link" to={receipt ? `/block/${receipt.blockNumber}` : '/'}>
        &larr; Back to block
      </Link>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && (transaction || receipt) && (
        <>
          <section className="page-heading">
            <div>
              <p className="eyebrow">Transaction</p>
              <h1>Transaction Details</h1>
            </div>
          </section>

          <section className="detail-card">
            <dl className="detail-grid">
              <Detail label="Transaction hash" value={transactionHash} />
              <Detail label="Block number" value={receipt?.blockNumber ?? transaction?.blockNumber} />
              <Detail label="Status" value={
                receipt?.status === 1
                  ? 'Success'
                  : receipt?.status === 0
                    ? 'Failed'
                    : 'Pending'
              } />
              <Detail label="From" value={receipt?.from ?? transaction?.from} />
              <Detail label="To" value={receipt?.to ?? transaction?.to ?? 'Contract creation'} />
              <Detail label="Value (wei)" value={formatGasUsed(transaction?.value)} />
              <Detail label="Gas limit" value={formatGasUsed(transaction?.gasLimit)} />
              <Detail label="Gas used" value={formatGasUsed(receipt?.gasUsed)} />
              <Detail label="Gas price (wei)" value={formatGasUsed(receipt?.effectiveGasPrice ?? transaction?.gasPrice)} />
              <Detail label="Nonce" value={transaction?.nonce} />
              <Detail label="Transaction index" value={receipt?.transactionIndex ?? transaction?.transactionIndex} />
              <Detail label="Contract address" value={receipt?.contractAddress} />
              <Detail label="Confirmations" value={receipt?.confirmations} />
            </dl>
          </section>

          {receipt?.logs?.length > 0 && (
            <section className="logs-section">
              <h2>Logs ({receipt.logs.length})</h2>
              <div className="log-list">
                {receipt.logs.map((log, index) => (
                  <div className="log-row" key={`${log.transactionHash}-${log.logIndex}-${index}`}>
                    <Detail label="Address" value={log.address} />
                    <Detail label="Topics" value={log.topics.join(', ')} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function AccountExplorer() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedAddress = address.trim();

    if (!isValidAddress(trimmedAddress)) {
      setError('Enter a valid Ethereum address beginning with 0x and containing 40 hexadecimal characters.');
      return;
    }

    setError('');
    history.push(`/account/${trimmedAddress}`);
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Ethereum Mainnet</p>
          <h1>Account Explorer</h1>
        </div>
      </section>

      <form className="account-search" onSubmit={handleSubmit}>
        <label htmlFor="account-address">Ethereum address</label>
        <div className="account-search-controls">
          <input
            id="account-address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="0x..."
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit">Look up account</button>
        </div>
        {error && <div className="error-message" role="alert">{error}</div>}
      </form>
    </main>
  );
}

function AccountDetails() {
  const { address } = useParams();
  const [balance, setBalance] = useState(null);
  const [transactionCount, setTransactionCount] = useState(null);
  const [code, setCode] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      if (!isValidAddress(address)) {
        if (active) {
          setError('The address in the URL is not a valid Ethereum address.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError('');

        const category = ['external', 'erc20', 'erc721', 'erc1155'];
        const [balanceResult, nonceResult, codeResult, incomingResult, outgoingResult] =
          await Promise.all([
            alchemy.core.getBalance(address),
            alchemy.core.getTransactionCount(address),
            alchemy.core.getCode(address),
            alchemy.core.getAssetTransfers({
              toAddress: address,
              category,
              maxCount: 25,
              order: 'desc',
            }),
            alchemy.core.getAssetTransfers({
              fromAddress: address,
              category,
              maxCount: 25,
              order: 'desc',
            }),
          ]);

        const transferMap = new Map();
        [...(incomingResult.transfers || []), ...(outgoingResult.transfers || [])].forEach((transfer) => {
          const key = `${transfer.hash}-${transfer.logIndex ?? transfer.category}-${transfer.asset ?? ''}`;
          transferMap.set(key, transfer);
        });

        if (active) {
          setBalance(balanceResult);
          setTransactionCount(nonceResult);
          setCode(codeResult);
          setTransfers(
            Array.from(transferMap.values()).sort((first, second) =>
              Number(second.blockNum || 0) - Number(first.blockNum || 0)
            )
          );
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load this account.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAccount();
    return () => {
      active = false;
    };
  }, [address]);

  return (
    <main className="page">
      <Link className="back-link" to="/accounts">
        &larr; Account search
      </Link>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} />}

      {!loading && !error && (
        <>
          <section className="page-heading">
            <div>
              <p className="eyebrow">Ethereum account</p>
              <h1>Account Details</h1>
            </div>
          </section>

          <section className="detail-card">
            <dl className="detail-grid">
              <Detail label="Address" value={address} />
              <Detail label="Balance (ETH)" value={formatEther(balance)} />
              <Detail label="Balance (wei)" value={formatGasUsed(balance)} />
              <Detail label="Transaction count" value={transactionCount} />
              <Detail label="Account type" value={code && code !== '0x' ? 'Contract' : 'Externally owned account'} />
              <Detail label="Contract code" value={code ? `${code.slice(0, 42)}${code.length > 42 ? '...' : ''}` : '0x'} />
            </dl>
          </section>

          <section className="transactions-section">
            <h2>Recent asset transfers ({transfers.length})</h2>
            {!transfers.length && (
              <div className="empty-message">No recent asset transfers were found.</div>
            )}
            {transfers.length > 0 && (
              <div className="transfer-list">
                {transfers.map((transfer, index) => (
                  <Link
                    className="transfer-row"
                    to={`/tx/${transfer.hash}`}
                    key={`${transfer.hash}-${transfer.logIndex ?? index}`}
                  >
                    <span>
                      <strong>{transfer.asset || transfer.category}</strong>
                      <small>{transfer.category}</small>
                    </span>
                    <span title={transfer.hash}>
                      <strong>Hash</strong>
                      <small>{formatHash(transfer.hash)}</small>
                    </span>
                    <span>
                      <strong>{transfer.from?.toLowerCase() === address.toLowerCase() ? 'Sent to' : 'Received from'}</strong>
                      <small>{formatHash(
                        transfer.from?.toLowerCase() === address.toLowerCase()
                          ? transfer.to
                          : transfer.from
                      )}</small>
                    </span>
                    <span>
                      <strong>Amount</strong>
                      <small>{transfer.value ?? 'NFT transfer'}</small>
                    </span>
                    <span>
                      <strong>Block</strong>
                      <small>{formatBlockNumber(transfer.blockNum)}</small>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function ExplorerTabs() {
  const location = useLocation();
  const blockExplorerActive =
    location.pathname === '/' ||
    location.pathname.startsWith('/block/') ||
    location.pathname.startsWith('/tx/');
  const accountExplorerActive =
    location.pathname.startsWith('/accounts') ||
    location.pathname.startsWith('/account/');

  return (
    <nav className="explorer-tabs" aria-label="Explorer sections">
      <Link
        className={blockExplorerActive ? 'active' : ''}
        to="/"
        aria-current={blockExplorerActive ? 'page' : undefined}
      >
        Block Explorer
      </Link>
      <Link
        className={accountExplorerActive ? 'active' : ''}
        to="/accounts"
        aria-current={accountExplorerActive ? 'page' : undefined}
      >
        Account Explorer
      </Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="site-header">
          <div className="header-content">
            <Link className="brand" to="/">
              ETH Explorer
            </Link>
            <ExplorerTabs />
          </div>
        </header>
        <Switch>
          <Route exact path="/" component={LatestBlocks} />
          <Route path="/block/:blockNumber" component={BlockDetails} />
          <Route path="/tx/:transactionHash" component={TransactionDetails} />
          <Route exact path="/accounts" component={AccountExplorer} />
          <Route path="/account/:address" component={AccountDetails} />
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default App;
