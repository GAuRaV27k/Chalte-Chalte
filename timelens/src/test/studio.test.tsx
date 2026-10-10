import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Creation Studio File Upload & Validation', () => {
  it('validates invalid file types and oversized files', async () => {
    render(<App />);

    // Go to Studio
    fireEvent.click(screen.getByRole('button', { name: /Launch Studio/i }));
    await waitFor(() => {
      expect(screen.getByText('Plate Registration & Context')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('landscape-file-input') as HTMLInputElement;

    // 1. Upload an invalid text file
    const invalidFile = new File(['text content'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid file format\. Please upload a TIFF, RAW, PNG, or JPEG image\./i)
      ).toBeInTheDocument();
    });

    // 2. Upload an oversized file (>64MB)
    const largeFile = new File([new ArrayBuffer(1024)], 'large.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 70 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/File size exceeds the 64MB threshold/i)
      ).toBeInTheDocument();
    });
  });

  it('allows loading sample redwood grove and toggling traveler selfie attire mode', async () => {
    render(<App />);

    // Go to Studio
    fireEvent.click(screen.getByRole('button', { name: /Launch Studio/i }));
    await waitFor(() => {
      expect(screen.getByText('Plate Registration & Context')).toBeInTheDocument();
    });

    // Reset first
    fireEvent.click(screen.getByRole('button', { name: /Clear & Reset/i }));

    // Click Load Sample Redwood Grove
    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample Redwood Grove/i });
    fireEvent.click(loadSampleBtn);

    expect(screen.getByDisplayValue(/Olympic National Park, Hoh Rain Forest, WA/i)).toBeInTheDocument();

    // Toggle Traveler Inclusion
    const travelerToggle = screen.getByLabelText(/Include Traveler in Scene/i) || screen.getByRole('checkbox');
    expect(travelerToggle).not.toBeChecked();
    fireEvent.click(travelerToggle);
    expect(travelerToggle).toBeChecked();

    // Verify attire mode radio options
    const silhouetteRadio = screen.getByLabelText(/Silhouetted Naturalist/i);
    fireEvent.click(silhouetteRadio);
    expect(silhouetteRadio).toBeChecked();

    // Proceed to Epochs should be enabled
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Historical Epochs/i });
    expect(proceedBtn).toBeEnabled();
  });
});
