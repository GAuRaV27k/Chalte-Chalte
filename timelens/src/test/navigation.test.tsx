import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('TimeLens AI Journey Navigation & State Preservation', () => {
  it('renders landing page with hero CTA and navigates to creation studio', async () => {
    render(<App />);

    expect(screen.getByText('Every Place Has a Past')).toBeInTheDocument();
    expect(screen.getByText('Open Science Initiative • Zero Persistent Telemetry')).toBeInTheDocument();

    const exploreCta = screen.getByRole('button', { name: /Explore the Past/i });
    fireEvent.click(exploreCta);

    // Should navigate to Creation Studio
    await waitFor(() => {
      expect(screen.getByText('Plate Registration & Context')).toBeInTheDocument();
    });
  });

  it('preserves user inputs when moving forward to era selection and back to studio', async () => {
    render(<App />);

    // Navigate to Studio
    const studioNavBtn = screen.getByRole('button', { name: /Launch Studio/i });
    fireEvent.click(studioNavBtn);

    await waitFor(() => {
      expect(screen.getByText('Plate Registration & Context')).toBeInTheDocument();
    });

    // Change location field
    const locationInput = screen.getByTestId('location-input') as HTMLInputElement;
    fireEvent.change(locationInput, { target: { value: 'Mount Rainier Alpine Ridge, WA' } });
    expect(locationInput.value).toBe('Mount Rainier Alpine Ridge, WA');

    // Proceed to Era Selection
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Historical Epochs/i });
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(screen.getByText('Select Target Geological Epoch')).toBeInTheDocument();
    });

    // Select Carboniferous era
    const carboniferousCard = screen.getByText('Carboniferous Primeval Swamp');
    fireEvent.click(carboniferousCard);

    // Now navigate back to Studio
    const studioTab = screen.getByRole('button', { name: /^Studio$/i });
    fireEvent.click(studioTab);

    // Verify location input was preserved
    await waitFor(() => {
      const inputAfterBack = screen.getByTestId('location-input') as HTMLInputElement;
      expect(inputAfterBack.value).toBe('Mount Rainier Alpine Ridge, WA');
    });

    // Return to Era Selection and verify selected era was preserved
    const eraTab = screen.getByRole('button', { name: /^Epochs$/i });
    fireEvent.click(eraTab);

    await waitFor(() => {
      expect(screen.getByText(/Selected Target:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Carboniferous Primeval Swamp/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('prevents navigation to Era Selection when landscape photo is missing after reset', async () => {
    render(<App />);

    // Go to Studio
    fireEvent.click(screen.getByRole('button', { name: /Launch Studio/i }));

    await waitFor(() => {
      expect(screen.getByText('Plate Registration & Context')).toBeInTheDocument();
    });

    // Click Clear & Reset
    const resetBtn = screen.getByRole('button', { name: /Clear & Reset/i });
    fireEvent.click(resetBtn);

    // Proceed button should be disabled
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Historical Epochs/i });
    expect(proceedBtn).toBeDisabled();

    // Trying to click Epochs navigation link directly redirects/keeps user on Studio
    const eraNavBtn = screen.getByRole('button', { name: /^Epochs$/i });
    fireEvent.click(eraNavBtn);

    expect(screen.getByText('Plate Registration & Context')).toBeInTheDocument();
  });
});
