export type ScreenId = 'landing' | 'studio' | 'era' | 'results';

export type ReconstructionMode = 'reconstruct' | 'imagine';

export type AttireMode = 'period' | 'silhouette' | 'modern';

export interface HistoricalEra {
  id: string;
  name: string;
  yearLabel: string;
  numericYear: number;
  yearSuffix: 'BCE' | 'CE';
  category: 'PALEOZOIC' | 'MESOZOIC' | 'QUATERNARY' | 'MEDIEVAL CLIMATIC' | 'EARLY ANTHROPOCENE' | 'CUSTOM';
  filterTag: 'Deep Paleozoic' | 'Mesozoic Fauna' | 'Quaternary Ice' | 'Holocene Biomes';
  description: string;
  avgTemp: string;
  tempDelta?: string;
  co2Level: string;
  floraIndex: string;
  floraLabel: string;
  durationLabel: string;
  imageUrl: string;
  isCalibratedBaseline?: boolean;
}

export interface PaleoclimateMetrics {
  meanAnnualTemp: string;
  tempDelta: string;
  iceMarginProximity: string;
  iceMarginStatus: string;
  dominantTaxa: string;
  soilCoreProfile: string;
  atmosphericOptics: string;
  glaciologyOffset: string;
  seed: number;
}

export interface GenerationResult {
  jobId: string;
  status: 'completed';
  reconstructedImageUrl: string;
  originalImageUrl: string;
  comparisonMetadata: {
    eraName: string;
    yearLabel: string;
    locationName: string;
    coordinates: string;
    mode: ReconstructionMode;
    travelerIncluded: boolean;
  };
  metrics: PaleoclimateMetrics;
  promptLatentJson: string;
  videoUrl?: string;
  completedAt: string;
  isSimulated: boolean;
}

export interface UserJourneyState {
  // Screen navigation
  currentScreen: ScreenId;

  // Source Capture (Studio)
  landscapeFile: File | null;
  landscapePreviewUrl: string | null;
  landscapeFileName: string;
  location: string;
  locationCoordinates: string;
  includeTraveler: boolean;
  selfieFile: File | null;
  selfiePreviewUrl: string | null;
  attireMode: AttireMode;

  // Era Selection
  selectedEraId: string;
  customYear: string;
  yearSuffix: 'BCE' | 'CE';
  reconstructionMode: ReconstructionMode;

  // Synthesis / Results
  generationJobId: string | null;
  generationStatus: 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';
  generationProgress: number;
  generationResult: GenerationResult | null;
  generationError: string | null;
  useSimulationDemo: boolean;
}
