import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadManager from './DownloadManager';

vi.mock('../utils/api', () => ({
  startDownload: vi.fn().mockResolvedValue({}),
  getDownloadProgress: vi.fn().mockResolvedValue({ status: 'not_started' }),
  batchDownload: vi.fn().mockResolvedValue({}),
  browseDirectory: vi.fn().mockResolvedValue({ current: '/', parent: null, directories: [] }),
}));

import { startDownload, getDownloadProgress, batchDownload } from '../utils/api';

const makeRequest = (id, title, artist) => ({
  id,
  title,
  artist,
  source: 'youtube',
  source_url: `https://youtube.com/watch?v=${id}`,
  thumbnail_url: `https://img.youtube.com/${id}.jpg`,
  vote_count: 1,
  voters: [{ guest_id: 'g1', display_name: 'Cool Cat' }],
});

const requests = [
  makeRequest('r1', 'Song A', 'Artist A'),
  makeRequest('r2', 'Song B', 'Artist B'),
  makeRequest('r3', 'Song C', 'Artist C'),
];

const event = { id: 'evt_1', download_folder: '/music/downloads' };

describe('DownloadManager', () => {
  let onUpdateEvent;

  beforeEach(() => {
    vi.clearAllMocks();
    onUpdateEvent = vi.fn().mockResolvedValue({});
    getDownloadProgress.mockResolvedValue({ status: 'not_started' });
  });

  it('renders download folder input', () => {
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);
    expect(screen.getByPlaceholderText(/default/i)).toHaveValue('/music/downloads');
  });

  it('renders browse button', () => {
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });

  it('renders all request items', () => {
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);
    expect(screen.getByText('Song A')).toBeInTheDocument();
    expect(screen.getByText('Song B')).toBeInTheDocument();
    expect(screen.getByText('Song C')).toBeInTheDocument();
  });

  it('shows download count', () => {
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);
    expect(screen.getByText(/0 \/ 3 downloaded/)).toBeInTheDocument();
  });

  it('renders DL buttons for each request', () => {
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);
    expect(screen.getAllByText('DL')).toHaveLength(3);
  });

  it('clicking DL calls startDownload', async () => {
    const user = userEvent.setup();
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);

    const dlButtons = screen.getAllByText('DL');
    await user.click(dlButtons[0]);

    expect(startDownload).toHaveBeenCalledWith('r1', '/music/downloads');
  });

  it('shows Download All Missing button', () => {
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);
    expect(screen.getByText(/download all missing/i)).toBeInTheDocument();
  });

  it('batch download calls batchDownload', async () => {
    const user = userEvent.setup();
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);

    await user.click(screen.getByText(/download all missing/i));

    expect(batchDownload).toHaveBeenCalledWith(
      ['r1', 'r2', 'r3'],
      '/music/downloads'
    );
  });

  it('shows Save button when folder is changed', async () => {
    const user = userEvent.setup();
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);

    expect(screen.queryByText('Save')).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText(/default/i);
    await user.type(input, '/new');

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('saving folder calls onUpdateEvent', async () => {
    const user = userEvent.setup();
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);

    const input = screen.getByPlaceholderText(/default/i);
    await user.clear(input);
    await user.type(input, '/new/path');
    await user.click(screen.getByText('Save'));

    expect(onUpdateEvent).toHaveBeenCalledWith({ download_folder: '/new/path' });
  });

  it('renders checkboxes for selection', () => {
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('shows completed status for downloaded items', async () => {
    getDownloadProgress.mockResolvedValue({ status: 'complete' });
    render(<DownloadManager requests={requests} eventId="evt_1" event={event} onUpdateEvent={onUpdateEvent} />);

    await waitFor(() => {
      expect(screen.getAllByText('Done')).toHaveLength(3);
    });
  });
});
