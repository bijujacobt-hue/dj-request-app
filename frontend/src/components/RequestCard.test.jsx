import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestCard from './RequestCard';

vi.mock('../utils/api', () => ({
  addVote: vi.fn().mockResolvedValue({}),
  removeVote: vi.fn().mockResolvedValue({}),
}));

import { addVote, removeVote } from '../utils/api';

const baseRequest = {
  id: 'req_1',
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  source: 'youtube',
  source_url: 'https://youtube.com/watch?v=abc',
  thumbnail_url: 'https://img.youtube.com/thumb.jpg',
  duration_seconds: 354,
  vote_count: 3,
  voters: [
    { guest_id: 'g1', display_name: 'Cool Cat' },
    { guest_id: 'g2', display_name: 'Happy Panda' },
    { guest_id: 'g3', display_name: 'Wild Fox' },
  ],
};

describe('RequestCard', () => {
  let onVoteChanged, onDelete;

  beforeEach(() => {
    vi.clearAllMocks();
    onVoteChanged = vi.fn();
    onDelete = vi.fn();
  });

  it('renders song title', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
  });

  it('renders artist name', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('renders vote count', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders voter names', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);
    expect(screen.getByText(/Cool Cat/)).toBeInTheDocument();
    expect(screen.getByText(/Happy Panda/)).toBeInTheDocument();
  });

  it('shows +N more when many voters', () => {
    const manyVoters = {
      ...baseRequest,
      vote_count: 5,
      voters: [
        { guest_id: 'g1', display_name: 'A' },
        { guest_id: 'g2', display_name: 'B' },
        { guest_id: 'g3', display_name: 'C' },
        { guest_id: 'g4', display_name: 'D' },
        { guest_id: 'g5', display_name: 'E' },
      ],
    };
    render(<RequestCard request={manyVoters} guestId="g1" onVoteChanged={onVoteChanged} />);
    expect(screen.getByText(/\+3 more/)).toBeInTheDocument();
  });

  it('renders thumbnail image', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);
    // alt="" gives role="presentation", so query by tag
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('src', baseRequest.thumbnail_url);
  });

  it('title links to source URL', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);
    const link = screen.getByRole('link', { name: 'Bohemian Rhapsody' });
    expect(link).toHaveAttribute('href', baseRequest.source_url);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('clicking vote button calls addVote when not voted', async () => {
    const user = userEvent.setup();
    render(<RequestCard request={baseRequest} guestId="g_new" onVoteChanged={onVoteChanged} />);

    // g_new is not in voters, so clicking should addVote
    const voteBtn = screen.getByRole('button', { name: /3/i });
    await user.click(voteBtn);

    expect(addVote).toHaveBeenCalledWith('req_1', 'g_new');
    expect(onVoteChanged).toHaveBeenCalled();
  });

  it('clicking vote button calls removeVote when already voted', async () => {
    const user = userEvent.setup();
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);

    // g1 is in voters, so clicking should removeVote
    const voteBtn = screen.getByRole('button', { name: /3/i });
    await user.click(voteBtn);

    expect(removeVote).toHaveBeenCalledWith('req_1', 'g1');
    expect(onVoteChanged).toHaveBeenCalled();
  });

  it('shows delete button for sole voter', () => {
    const soleVoterReq = {
      ...baseRequest,
      vote_count: 1,
      voters: [{ guest_id: 'g1', display_name: 'Cool Cat' }],
    };
    render(<RequestCard request={soleVoterReq} guestId="g1" onVoteChanged={onVoteChanged} onDelete={onDelete} />);
    expect(screen.getByTitle('Remove your request')).toBeInTheDocument();
  });

  it('hides delete button for non-sole voter', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} onDelete={onDelete} />);
    expect(screen.queryByTitle('Remove your request')).not.toBeInTheDocument();
  });

  it('hides delete button when onDelete not provided', () => {
    const soleVoterReq = {
      ...baseRequest,
      vote_count: 1,
      voters: [{ guest_id: 'g1', display_name: 'Cool Cat' }],
    };
    render(<RequestCard request={soleVoterReq} guestId="g1" onVoteChanged={onVoteChanged} />);
    expect(screen.queryByTitle('Remove your request')).not.toBeInTheDocument();
  });

  it('delete button calls onDelete after confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);
    const soleVoterReq = {
      ...baseRequest,
      vote_count: 1,
      voters: [{ guest_id: 'g1', display_name: 'Cool Cat' }],
    };
    render(<RequestCard request={soleVoterReq} guestId="g1" onVoteChanged={onVoteChanged} onDelete={onDelete} />);

    await user.click(screen.getByTitle('Remove your request'));
    expect(onDelete).toHaveBeenCalledWith('req_1');
  });

  it('delete is cancelled when confirmation is declined', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);
    const soleVoterReq = {
      ...baseRequest,
      vote_count: 1,
      voters: [{ guest_id: 'g1', display_name: 'Cool Cat' }],
    };
    render(<RequestCard request={soleVoterReq} guestId="g1" onVoteChanged={onVoteChanged} onDelete={onDelete} />);

    await user.click(screen.getByTitle('Remove your request'));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('formats duration correctly', () => {
    render(<RequestCard request={baseRequest} guestId="g1" onVoteChanged={onVoteChanged} />);
    // 354 seconds = 5:54
    expect(screen.getByText(/5:54/)).toBeInTheDocument();
  });
});
