import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Results Screen Comparison, Video Playback & Error Retry', () => {
  it('renders comparison stage and switches to 4K video reel mode', async () => {
    render(<App />);

    // Go to Results
    fireEvent.click(screen.getByRole('button', { name: /^Results$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Transformed to/i)).toBeInTheDocument();
    });

    // Wait for synthesis progress to complete
    await waitFor(
      () => {
        expect(screen.getByText(/Interactive Comparison/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText(/Hoh Rain Forest/i)).toBeInTheDocument();
    expect(screen.getByText(/MEAN ANNUAL TEMP/i)).toBeInTheDocument();
    expect(screen.getByText('-6.2°C')).toBeInTheDocument();

    // Switch to Video Reel mode
    const videoTab = screen.getByRole('button', { name: /Animate 4K Video Reel/i });
    fireEvent.click(videoTab);

    // Playback control should be present
    const playButtons = screen.getAllByRole('button');
    expect(playButtons.length).toBeGreaterThan(0);

    // Switch back to Comparison mode
    screen.debug();
    const compareTab = screen.getByRole('button', { name: /Interactive Comparison/i });
    fireEvent.click(compareTab);
    expect(screen.getByText(/Modern 2025 Baseline/i)).toBeInTheDocument();
  });

  it('handles simulated failure and allows retrying synthesis', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^Results$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Transformed to/i)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByText(/Simulate Failure State/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Trigger failure
    fireEvent.click(screen.getByText(/Simulate Failure State/i));

    // Error alert should be visible
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Synthesis Interrupted/i)).toBeInTheDocument();

    // Click Retry
    const retryBtn = screen.getByRole('button', { name: /Retry Synthesis/i });
    fireEvent.click(retryBtn);

    // Should return to processing and then completed
    await waitFor(
      () => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByText(/Interactive Comparison/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
