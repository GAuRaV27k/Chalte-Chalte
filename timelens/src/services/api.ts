import type { AttireMode, GenerationResult, ReconstructionMode } from '../types';

export interface CreateGenerationPayload {
  landscapeImage: File;
  selfieImage?: File | null;
  eraId: string;
  customYear?: string;
  yearSuffix?: 'BCE' | 'CE';
  reconstructionMode: ReconstructionMode;
  location: string;
  attireMode?: AttireMode;
}

export type GenerationJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface GenerationJobResponse {
  job_id: string;
  status: GenerationJobStatus;
  progress_percent: number;
  message: string;
  created_at: string;
  estimated_seconds_remaining?: number;
}

export interface GenerationStatusResponse {
  job_id: string;
  status: GenerationJobStatus;
  progress_percent: number;
  message: string;
  created_at: string;
  completed_at?: string;
  error?: string;
  result?: {
    reconstructed_image_url: string;
    cinematic_video_url?: string;
    original_image_url: string;
    comparison_metadata: {
      era_name: string;
      year_label: string;
      location_name: string;
      coordinates: string;
      mode: ReconstructionMode;
      traveler_included: boolean;
    };
    paleoclimate_metrics: {
      mean_annual_temp: string;
      temp_delta: string;
      ice_margin_proximity: string;
      ice_margin_status: string;
      dominant_taxa: string;
      soil_core_profile: string;
      atmospheric_optics: string;
      glaciology_offset: string;
      seed: number;
    };
    prompt_latent_json: string;
  };
}

export interface ApiErrorResponse {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  errorCode: string;
  details?: Record<string, unknown>;

  constructor(message: string, errorCode = 'UNKNOWN_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.details = details;
  }
}

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || '';
};

/**
 * Real API client layer for TimeLens AI backend service.
 * Connects to future inference service without requiring component rewrites.
 */
export const TimeLensApiClient = {
  /**
   * Submit a new historical generation job with landscape photo and parameters.
   * Target endpoint: POST /api/v1/generations (multipart/form-data)
   */
  async createGenerationJob(payload: CreateGenerationPayload): Promise<GenerationJobResponse> {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      throw new ApiError(
        'VITE_API_BASE_URL is not configured. Real backend connection is not established.',
        'BACKEND_URL_MISSING'
      );
    }

    const formData = new FormData();
    formData.append('landscape_image', payload.landscapeImage);
    if (payload.selfieImage) {
      formData.append('selfie_image', payload.selfieImage);
    }
    formData.append('era_id', payload.eraId);
    if (payload.customYear) {
      formData.append('custom_year', payload.customYear);
    }
    if (payload.yearSuffix) {
      formData.append('year_suffix', payload.yearSuffix);
    }
    formData.append('reconstruction_mode', payload.reconstructionMode);
    formData.append('location', payload.location);
    if (payload.attireMode) {
      formData.append('attire_mode', payload.attireMode);
    }

    const response = await fetch(`${baseUrl}/api/v1/generations`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorJson = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      throw new ApiError(
        errorJson.message || `Generation job submission failed with HTTP ${response.status}`,
        errorJson.error_code || `HTTP_${response.status}`,
        errorJson.details
      );
    }

    return (await response.json()) as GenerationJobResponse;
  },

  /**
   * Poll or retrieve generation job status and final output assets.
   * Target endpoint: GET /api/v1/generations/{job_id}
   */
  async getGenerationJobStatus(jobId: string): Promise<GenerationStatusResponse> {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      throw new ApiError(
        'VITE_API_BASE_URL is not configured. Real backend connection is not established.',
        'BACKEND_URL_MISSING'
      );
    }

    const response = await fetch(`${baseUrl}/api/v1/generations/${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorJson = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      throw new ApiError(
        errorJson.message || `Status retrieval failed with HTTP ${response.status}`,
        errorJson.error_code || `HTTP_${response.status}`,
        errorJson.details
      );
    }

    return (await response.json()) as GenerationStatusResponse;
  },

  /**
   * Map raw backend status response to application GenerationResult format
   */
  mapToGenerationResult(data: GenerationStatusResponse): GenerationResult {
    if (data.status !== 'completed' || !data.result) {
      throw new ApiError('Cannot map incomplete generation job to result', 'INCOMPLETE_JOB');
    }

    return {
      jobId: data.job_id,
      status: 'completed',
      reconstructedImageUrl: data.result.reconstructed_image_url,
      originalImageUrl: data.result.original_image_url,
      videoUrl: data.result.cinematic_video_url,
      comparisonMetadata: {
        eraName: data.result.comparison_metadata.era_name,
        yearLabel: data.result.comparison_metadata.year_label,
        locationName: data.result.comparison_metadata.location_name,
        coordinates: data.result.comparison_metadata.coordinates,
        mode: data.result.comparison_metadata.mode,
        travelerIncluded: data.result.comparison_metadata.traveler_included,
      },
      metrics: {
        meanAnnualTemp: data.result.paleoclimate_metrics.mean_annual_temp,
        tempDelta: data.result.paleoclimate_metrics.temp_delta,
        iceMarginProximity: data.result.paleoclimate_metrics.ice_margin_proximity,
        iceMarginStatus: data.result.paleoclimate_metrics.ice_margin_status,
        dominantTaxa: data.result.paleoclimate_metrics.dominant_taxa,
        soilCoreProfile: data.result.paleoclimate_metrics.soil_core_profile,
        atmosphericOptics: data.result.paleoclimate_metrics.atmospheric_optics,
        glaciologyOffset: data.result.paleoclimate_metrics.glaciology_offset,
        seed: data.result.paleoclimate_metrics.seed,
      },
      promptLatentJson: data.result.prompt_latent_json,
      completedAt: data.completed_at || new Date().toISOString(),
      isSimulated: false,
    };
  },
};
