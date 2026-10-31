import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('alchemy-sdk', () => ({
  Alchemy: jest.fn().mockImplementation(() => ({
    core: {
      getBlockNumber: jest.fn().mockResolvedValue(19000000),
      getBlock: jest.fn().mockResolvedValue({
        number: 19000000,
        hash: '0x1234567890abcdef',
        miner: '0xabcdef1234567890',
        timestamp: 1700000000,
        transactions: [],
      }),
      getBlockWithTransactions: jest.fn(),
      getTransaction: jest.fn(),
      getTransactionReceipt: jest.fn(),
      getBalance: jest.fn(),
      getTransactionCount: jest.fn(),
      getCode: jest.fn(),
      getAssetTransfers: jest.fn(),
    },
  })),
  Network: { ETH_MAINNET: 'eth-mainnet' },
}));

test('renders the latest blocks heading', async () => {
  render(<App />);

  expect(await screen.findByText('Latest Blocks')).toBeInTheDocument();
  expect(await screen.findByText('19000000')).toBeInTheDocument();
});

test('renders the block and account explorer tabs', () => {
  render(<App />);

  expect(screen.getByRole('link', { name: 'Block Explorer' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Account Explorer' })).toBeInTheDocument();
});
