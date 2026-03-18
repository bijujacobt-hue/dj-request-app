import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NamePicker from './NamePicker';

vi.mock('../utils/api', () => ({
  updateGuestName: vi.fn(),
}));

import { updateGuestName } from '../utils/api';

const guest = { id: 'g1', display_name: 'Cool Cat' };

describe('NamePicker', () => {
  let onNameUpdated;

  beforeEach(() => {
    vi.clearAllMocks();
    onNameUpdated = vi.fn();
  });

  it('renders current guest name', () => {
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);
    expect(screen.getByText('Cool Cat')).toBeInTheDocument();
  });

  it('shows change name button', () => {
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);
    expect(screen.getByText('change name')).toBeInTheDocument();
  });

  it('clicking change name shows edit form', async () => {
    const user = userEvent.setup();
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);

    await user.click(screen.getByText('change name'));

    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('edit form pre-fills with current name', async () => {
    const user = userEvent.setup();
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);

    await user.click(screen.getByText('change name'));

    expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue('Cool Cat');
  });

  it('saving calls updateGuestName and onNameUpdated', async () => {
    const updatedGuest = { id: 'g1', display_name: 'New Name' };
    updateGuestName.mockResolvedValue(updatedGuest);
    const user = userEvent.setup();
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);

    await user.click(screen.getByText('change name'));
    const input = screen.getByPlaceholderText(/enter your name/i);
    await user.clear(input);
    await user.type(input, 'New Name');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateGuestName).toHaveBeenCalledWith('g1', 'New Name');
      expect(onNameUpdated).toHaveBeenCalledWith(updatedGuest);
    });
  });

  it('cancel returns to display mode', async () => {
    const user = userEvent.setup();
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);

    await user.click(screen.getByText('change name'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));

    expect(screen.getByText('Cool Cat')).toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('save is disabled with empty name', async () => {
    const user = userEvent.setup();
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);

    await user.click(screen.getByText('change name'));
    const input = screen.getByPlaceholderText(/enter your name/i);
    await user.clear(input);

    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('pressing Enter saves the name', async () => {
    const updatedGuest = { id: 'g1', display_name: 'Enter Name' };
    updateGuestName.mockResolvedValue(updatedGuest);
    const user = userEvent.setup();
    render(<NamePicker guest={guest} onNameUpdated={onNameUpdated} />);

    await user.click(screen.getByText('change name'));
    const input = screen.getByPlaceholderText(/enter your name/i);
    await user.clear(input);
    await user.type(input, 'Enter Name{Enter}');

    await waitFor(() => {
      expect(updateGuestName).toHaveBeenCalledWith('g1', 'Enter Name');
    });
  });
});
