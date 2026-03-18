import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RequestList from './RequestList';

vi.mock('../utils/api', () => ({
  addVote: vi.fn().mockResolvedValue({}),
  removeVote: vi.fn().mockResolvedValue({}),
}));

const makeRequest = (id, title, artist, voteCount) => ({
  id,
  title,
  artist,
  source: 'youtube',
  source_url: `https://youtube.com/watch?v=${id}`,
  thumbnail_url: `https://img.youtube.com/${id}.jpg`,
  vote_count: voteCount,
  voters: [{ guest_id: 'g1', display_name: 'Cool Cat' }],
});

describe('RequestList', () => {
  it('shows empty state when no requests', () => {
    render(<RequestList requests={[]} guestId="g1" onVoteChanged={vi.fn()} />);
    expect(screen.getByText(/no requests yet/i)).toBeInTheDocument();
    expect(screen.getByText(/be the first/i)).toBeInTheDocument();
  });

  it('renders all request cards', () => {
    const requests = [
      makeRequest('r1', 'Song A', 'Artist A', 5),
      makeRequest('r2', 'Song B', 'Artist B', 3),
      makeRequest('r3', 'Song C', 'Artist C', 1),
    ];
    render(<RequestList requests={requests} guestId="g1" onVoteChanged={vi.fn()} />);
    expect(screen.getByText('Song A')).toBeInTheDocument();
    expect(screen.getByText('Song B')).toBeInTheDocument();
    expect(screen.getByText('Song C')).toBeInTheDocument();
  });

  it('displays rank numbers', () => {
    const requests = [
      makeRequest('r1', 'Song A', 'Artist A', 5),
      makeRequest('r2', 'Song B', 'Artist B', 3),
    ];
    render(<RequestList requests={requests} guestId="g1" onVoteChanged={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders single request correctly', () => {
    const requests = [makeRequest('r1', 'Only Song', 'Only Artist', 1)];
    render(<RequestList requests={requests} guestId="g1" onVoteChanged={vi.fn()} />);
    expect(screen.getByText('Only Song')).toBeInTheDocument();
    expect(screen.getByText('Only Artist')).toBeInTheDocument();
  });
});
