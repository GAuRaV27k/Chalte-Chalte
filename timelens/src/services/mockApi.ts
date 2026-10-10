import { HISTORICAL_ERAS, SAMPLE_MODERN_IMAGE, SAMPLE_RECONSTRUCTION_IMAGE } from '../data/eras';
import type { GenerationResult } from '../types';
import type { CreateGenerationPayload, GenerationJobResponse, GenerationStatusResponse } from './api';

/**
 * Isolated development-only simulation service.
 * NOTE: This service is strictly for frontend demonstration and integration testing
 * while the real AI model inference cluster is offline.
 * It is clearly marked with `isSimulated: true`.
 */
export const TimeLensMockService = {
  activeJobs: new Map<string, { progress: number; startTime: number; payload: CreateGenerationPayload; shouldFail?: boolean }>(),

  async submitSimulatedJob(payload: CreateGenerationPayload, shouldFail = false): Promise<GenerationJobResponse> {
    const jobId = `demo_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.activeJobs.set(jobId, {
      progress: 5,
      startTime: Date.now(),
      payload,
      shouldFail,
    });

    return {
      job_id: jobId,
      status: 'queued',
      progress_percent: 5,
      message: 'Simulated pipeline queued in volatile local instance (Demo mode)',
      created_at: new Date().toISOString(),
      estimated_seconds_remaining: 3,
    };
  },

  async pollSimulatedJob(jobId: string): Promise<GenerationStatusResponse> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Simulated job ${jobId} not found.`);
    }

    const elapsedMs = Date.now() - job.startTime;

    if (job.shouldFail && elapsedMs > 1200) {
      return {
        job_id: jobId,
        status: 'failed',
        progress_percent: 45,
        message: 'Simulated generation failure: Latent VAE tensor mismatch during mock inference test',
        created_at: new Date(job.startTime).toISOString(),
        error: 'Tensor decomposition timeout during sample run. You can retry with calibrated parameters.',
      };
    }

    if (elapsedMs < 1000) {
      return {
        job_id: jobId,
        status: 'queued',
        progress_percent: 25,
        message: 'Decomposing source foliage and geodetic anchor...',
        created_at: new Date(job.startTime).toISOString(),
      };
    }

    if (elapsedMs < 2200) {
      return {
        job_id: jobId,
        status: 'processing',
        progress_percent: 70,
        message: 'Running SVD temporal diffusion with botanical priors...',
        created_at: new Date(job.startTime).toISOString(),
      };
    }

    // Complete
    const era = HISTORICAL_ERAS.find((e) => e.id === job.payload.eraId) || HISTORICAL_ERAS[2];
    const originalPreviewUrl = job.payload.landscapeImage instanceof File
      ? URL.createObjectURL(job.payload.landscapeImage)
      : SAMPLE_MODERN_IMAGE;

    return {
      job_id: jobId,
      status: 'completed',
      progress_percent: 100,
      message: 'Simulated synthesis complete (Demo dataset)',
      created_at: new Date(job.startTime).toISOString(),
      completed_at: new Date().toISOString(),
      result: {
        reconstructed_image_url: SAMPLE_RECONSTRUCTION_IMAGE,
        original_image_url: originalPreviewUrl,
        cinematic_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        comparison_metadata: {
          era_name: era.name,
          year_label: era.yearLabel,
          location_name: job.payload.location || 'Olympic National Park, Hoh Rain Forest, WA',
          coordinates: '47.8601° N, 123.9348° W',
          mode: job.payload.reconstructionMode,
          traveler_included: Boolean(job.payload.selfieImage),
        },
        paleoclimate_metrics: {
          mean_annual_temp: '-6.2°C',
          temp_delta: '-17.6°C vs contemporary baseline',
          ice_margin_proximity: '14.8 km',
          ice_margin_status: 'Cordilleran advance phase',
          dominant_taxa: 'Picea glauca (White spruce), Betula nana, Artemisia steppe',
          soil_core_profile: 'Permafrost cryosol with solifluction banding',
          atmospheric_optics: 'High-latitude ice-crystal refraction, low cold fog',
          glaciology_offset: 'Cordilleran Ice Sheet terminus ~12.4 km north',
          seed: 914088219,
        },
        prompt_latent_json: JSON.stringify(
          {
            epoch: era.name,
            year: era.yearLabel,
            location: job.payload.location || 'Olympic Peninsula, WA',
            coordinates: '47.8601° N, 123.9348° W',
            reconstruction_mode: job.payload.reconstructionMode,
            traveler_anchored: Boolean(job.payload.selfieImage),
            paleo_params: {
              cfg_scale: 7.5,
              denoise: 0.88,
              svd_fps: 24,
              motion_bucket_id: 127,
            },
            model: 'TL-PALEO-70B-DIFFUSION (Demo weights)',
            scientific_disclaimer:
              'Simulated demo reconstruction for visualization; does not constitute empirically verified historical record.',
          },
          null,
          2
        ),
      },
    };
  },

  createSimulatedResult(payload: CreateGenerationPayload, originalImageUrl: string): GenerationResult {
    const era = HISTORICAL_ERAS.find((e) => e.id === payload.eraId) || HISTORICAL_ERAS[2];

    return {
      jobId: `sim_${Date.now()}`,
      status: 'completed',
      reconstructedImageUrl: SAMPLE_RECONSTRUCTION_IMAGE,
      originalImageUrl,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      comparisonMetadata: {
        eraName: era.name,
        yearLabel: era.yearLabel,
        locationName: payload.location || 'Olympic National Park, Hoh Rain Forest, WA',
        coordinates: '47.8601° N, 123.9348° W',
        mode: payload.reconstructionMode,
        travelerIncluded: Boolean(payload.selfieImage),
      },
      metrics: {
        meanAnnualTemp: '-6.2°C',
        tempDelta: '-17.6°C',
        iceMarginProximity: '14.8 km',
        iceMarginStatus: 'Advancing',
        dominantTaxa: 'Subalpine fir (Abies lasiocarpa) & Tundra lichen dominance',
        soilCoreProfile: 'Permafrost cryosol with active freeze-thaw solifluction bands',
        atmosphericOptics: 'High-latitude ice-crystal refraction, persistent low cold morning haze',
        glaciologyOffset: 'Cordilleran Ice Sheet terminus located ~12.4 km north of viewfinder',
        seed: 914088219,
      },
      promptLatentJson: JSON.stringify(
        {
          epoch: era.name,
          year: era.yearLabel,
          location: payload.location || 'Olympic Peninsula, WA',
          coordinates: '47.8601° N, 123.9348° W',
          reconstruction_mode: payload.reconstructionMode,
          traveler_anchored: Boolean(payload.selfieImage),
          paleo_params: {
            cfg_scale: 7.5,
            denoise: 0.88,
            svd_fps: 24,
            motion_bucket_id: 127,
          },
          weights_hash: 'sha256:d8c07f43b91a729e083c9284...',
          scientific_disclaimer:
            'AI-generated reconstruction informed by botanical & geological datasets; not verified archaeological evidence.',
        },
        null,
        2
      ),
      completedAt: new Date().toISOString(),
      isSimulated: true,
    };
  },
};
