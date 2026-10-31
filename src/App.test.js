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
    },
  })),
  Network: { ETH_MAINNET: 'eth-mainnet' },
}));

test('renders the latest blocks heading', async () => {
  render(<App />);

  expect(await screen.findByText('Latest Blocks')).toBeInTheDocument();
  expect(await screen.findByText('19000000')).toBeInTheDocument();
});
