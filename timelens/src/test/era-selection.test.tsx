import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Era Selection Timeline & Reconstruction Modes', () => {
  it('switches between empirical reconstruction and imaginative mode', async () => {
    render(<App />);

    // Go to Epochs
    fireEvent.click(screen.getByRole('button', { name: /^Epochs$/i }));

    await waitFor(() => {
      expect(screen.getByText('Select Target Geological Epoch')).toBeInTheDocument();
    });

    const reconstructBtn = screen.getByRole('button', { name: /Historical Reconstruction/i });
    const imagineBtn = screen.getByRole('button', { name: /Imagine the Past/i });

    // Click Imagine the Past
    fireEvent.click(imagineBtn);

    // Verify scientific disclaimer reflects imaginative mode
    expect(
      screen.getByText(/Imaginative scenario mode prioritizes atmospheric speculation/i)
    ).toBeInTheDocument();

    // Click back to Historical Reconstruction
    fireEvent.click(reconstructBtn);
    expect(
      screen.getByText(/Empirical mode activates fossil pollen matrices/i)
    ).toBeInTheDocument();
  });

  it('filters historical eras by stratigraphic category', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^Epochs$/i }));

    await waitFor(() => {
      expect(screen.getByText('Select Target Geological Epoch')).toBeInTheDocument();
    });

    // Filter by Deep Paleozoic
    const paleozoicFilter = screen.getByRole('button', { name: /Deep Paleozoic/i });
    fireEvent.click(paleozoicFilter);

    expect(screen.getByText('Carboniferous Primeval Swamp')).toBeInTheDocument();
    expect(screen.queryByText('Late Cretaceous Wilderness')).not.toBeInTheDocument();

    // Filter by Mesozoic Fauna
    const mesozoicFilter = screen.getByRole('button', { name: /Mesozoic Fauna/i });
    fireEvent.click(mesozoicFilter);

    expect(screen.getByText('Late Cretaceous Wilderness')).toBeInTheDocument();
    expect(screen.queryByText('Carboniferous Primeval Swamp')).not.toBeInTheDocument();
  });
});
