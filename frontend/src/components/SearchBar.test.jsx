import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

// Mock the api module
vi.mock('../utils/api', () => ({
  searchYouTube: vi.fn(),
}));

import { searchYouTube } from '../utils/api';

const mockResults = [
  {
    id: 'vid1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    thumbnail: 'https://img.youtube.com/thumb1.jpg',
    duration: 354,
    source: 'youtube',
    url: 'https://youtube.com/watch?v=vid1',
  },
  {
    id: 'vid2',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    thumbnail: 'https://img.youtube.com/thumb2.jpg',
    duration: 482,
    source: 'youtube',
    url: 'https://youtube.com/watch?v=vid2',
  },
];

describe('SearchBar', () => {
  let onSelect;

  beforeEach(() => {
    vi.clearAllMocks();
    onSelect = vi.fn();
  });

  it('renders input field with placeholder', () => {
    render(<SearchBar onSelect={onSelect} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('typing updates input value', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'test query');
    expect(input).toHaveValue('test query');
  });

  it('submitting triggers search', async () => {
    searchYouTube.mockResolvedValue({ results: mockResults });
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Bohemian Rhapsody');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(searchYouTube).toHaveBeenCalledWith('Bohemian Rhapsody');
    });
  });

  it('does not search with empty input', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(searchYouTube).not.toHaveBeenCalled();
  });

  it('displays search results', async () => {
    searchYouTube.mockResolvedValue({ results: mockResults });
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'queen');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
      expect(screen.getByText('Stairway to Heaven')).toBeInTheDocument();
    });
  });

  it('displays artist names in results', async () => {
    searchYouTube.mockResolvedValue({ results: mockResults });
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);

    await user.type(screen.getByPlaceholderText(/search/i), 'queen');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Queen')).toBeInTheDocument();
      expect(screen.getByText('Led Zeppelin')).toBeInTheDocument();
    });
  });

  it('clicking result triggers onSelect', async () => {
    searchYouTube.mockResolvedValue({ results: mockResults });
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);

    await user.type(screen.getByPlaceholderText(/search/i), 'queen');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bohemian Rhapsody'));
    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('clears results after selection', async () => {
    searchYouTube.mockResolvedValue({ results: mockResults });
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);

    await user.type(screen.getByPlaceholderText(/search/i), 'queen');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bohemian Rhapsody'));

    await waitFor(() => {
      expect(screen.queryByText('Stairway to Heaven')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during search', async () => {
    let resolveSearch;
    searchYouTube.mockReturnValue(new Promise(r => { resolveSearch = r; }));
    const user = userEvent.setup();
    render(<SearchBar onSelect={onSelect} />);

    await user.type(screen.getByPlaceholderText(/search/i), 'queen');
    await user.click(screen.getByRole('button', { name: /search/i }));

    // Button should be disabled during search
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();

    resolveSearch({ results: mockResults });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /search/i })).not.toBeDisabled();
    });
  });
});
