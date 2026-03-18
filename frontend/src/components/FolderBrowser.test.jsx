import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FolderBrowser from './FolderBrowser';

vi.mock('../utils/api', () => ({
  browseDirectory: vi.fn(),
}));

import { browseDirectory } from '../utils/api';

const mockDirectories = {
  current: '/Users/dj/Music',
  parent: '/Users/dj',
  directories: [
    { name: 'Rock', path: '/Users/dj/Music/Rock' },
    { name: 'Jazz', path: '/Users/dj/Music/Jazz' },
    { name: 'Electronic', path: '/Users/dj/Music/Electronic' },
  ],
};

describe('FolderBrowser', () => {
  let onSelect, onClose;

  beforeEach(() => {
    vi.clearAllMocks();
    onSelect = vi.fn();
    onClose = vi.fn();
    browseDirectory.mockResolvedValue(mockDirectories);
  });

  it('renders and loads directory listing', async () => {
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Rock')).toBeInTheDocument();
      expect(screen.getByText('Jazz')).toBeInTheDocument();
      expect(screen.getByText('Electronic')).toBeInTheDocument();
    });
  });

  it('shows header with title', async () => {
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByText('Browse Folders')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    browseDirectory.mockReturnValue(new Promise(() => {})); // never resolves
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('navigating into subfolder calls browseDirectory', async () => {
    const user = userEvent.setup();
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Rock')).toBeInTheDocument();
    });

    browseDirectory.mockResolvedValue({
      current: '/Users/dj/Music/Rock',
      parent: '/Users/dj/Music',
      directories: [
        { name: 'Classic Rock', path: '/Users/dj/Music/Rock/Classic Rock' },
      ],
    });

    await user.click(screen.getByText('Rock'));

    await waitFor(() => {
      expect(browseDirectory).toHaveBeenCalledWith('/Users/dj/Music/Rock');
      expect(screen.getByText('Classic Rock')).toBeInTheDocument();
    });
  });

  it('can navigate up with .. button', async () => {
    const user = userEvent.setup();
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('..')).toBeInTheDocument();
    });

    browseDirectory.mockResolvedValue({
      current: '/Users/dj',
      parent: '/Users',
      directories: [
        { name: 'Music', path: '/Users/dj/Music' },
        { name: 'Documents', path: '/Users/dj/Documents' },
      ],
    });

    await user.click(screen.getByText('..'));

    await waitFor(() => {
      expect(browseDirectory).toHaveBeenCalledWith('/Users/dj');
    });
  });

  it('displays current path in footer', async () => {
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('/Users/dj/Music')).toBeInTheDocument();
    });
  });

  it('select button calls onSelect with current path', async () => {
    const user = userEvent.setup();
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Select This Folder')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select This Folder'));
    expect(onSelect).toHaveBeenCalledWith('/Users/dj/Music');
  });

  it('close button calls onClose', async () => {
    const user = userEvent.setup();
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    // The close button is the × in the header
    const closeBtn = screen.getByText('\u00d7');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error on browse failure', async () => {
    browseDirectory.mockRejectedValue(new Error('Permission denied'));
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument();
    });
  });

  it('shows empty state when no subdirectories', async () => {
    browseDirectory.mockResolvedValue({
      current: '/Users/dj/Music/Empty',
      parent: '/Users/dj/Music',
      directories: [],
    });
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('No subdirectories')).toBeInTheDocument();
    });
  });
});
