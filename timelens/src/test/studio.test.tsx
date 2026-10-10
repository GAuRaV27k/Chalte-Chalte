import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Creation Studio File Upload & Validation', () => {
  it('validates invalid file types and oversized files', async () => {
    render(<App />);

    // Go to Studio
    fireEvent.click(screen.getByRole('button', { name: /Launch Studio/i }));
    await waitFor(() => {
      expect(screen.getByText('Capture Your Landscape')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('landscape-file-input') as HTMLInputElement;

    // 1. Upload an invalid text file
    const invalidFile = new File(['text content'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/This file type is not supported/i)
      ).toBeInTheDocument();
    });

    // 2. Upload an oversized file (>25MB)
    const largeFile = new File([new ArrayBuffer(1024)], 'large.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 30 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/File size exceeds 25MB limit/i)
      ).toBeInTheDocument();
    });
  });

  it('allows loading sample redwood grove and toggling traveler selfie attire mode', async () => {
    render(<App />);

    // Go to Studio
    fireEvent.click(screen.getByRole('button', { name: /Launch Studio/i }));
    await waitFor(() => {
      expect(screen.getByText('Capture Your Landscape')).toBeInTheDocument();
    });

    // Reset first
    fireEvent.click(screen.getByRole('button', { name: /Clear & Reset/i }));

    // Click Load Sample Redwood Grove
    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample Redwood Grove/i });
    fireEvent.click(loadSampleBtn);

    expect(screen.getByDisplayValue(/Olympic National Park, Hoh Rain Forest, WA/i)).toBeInTheDocument();

    // Toggle Traveler Inclusion
    const travelerToggle = screen.getByTestId('traveler-toggle');
    expect(travelerToggle).not.toBeChecked();
    fireEvent.click(travelerToggle);
    expect(travelerToggle).toBeChecked();

    // Verify attire mode radio options
    const silhouetteRadio = screen.getByLabelText(/Silhouetted Observer/i);
    fireEvent.click(silhouetteRadio);
    expect(silhouetteRadio).toBeChecked();

    // Proceed to Epochs should be enabled
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Historical Epochs/i });
    expect(proceedBtn).toBeEnabled();
  });
});
