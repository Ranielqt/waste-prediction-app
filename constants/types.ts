// types.ts - Updated with Volume Risk and Real Metrics

export type RiskLevel = 'safe' | 'moderate' | 'high';

export interface Prediction {
  barangayId: string;
  barangayName: string;
  date: string;
  predictedVolume: number;
  overflowRisk: RiskLevel;
  overflowProbability: number;
  confidence: number;
  factors: FeatureImportance[];
  mlConfidence?: number; // NEW: ML model confidence
  mlModelVersion?: string; // NEW: Which ML model was used
  
  // NEW: Volume Risk Categories
  volumeRisk?: {
    volume_risk: 'Normal Volume' | 'Moderate Volume' | 'High Volume';
    color: string;
    action: string;
    icon?: string;
    level: 1 | 2 | 3; // 1=Normal, 2=Moderate, 3=High
    threshold?: string;
  };
  
  // Additional API response fields
  timestamp?: string;
  events?: string[];
  eventMultiplier?: number;
}

export interface FeatureImportance {
  feature: string;
  value: string;
  importance: number;
}

export interface ModelMetrics {
  // REAL METRICS from training
  r2: number; // R² Score (0.966 from your training)
  mse: number; // Mean Squared Error (1,376,680.44 from your training)
  accuracy: number; // Accuracy (0.812 = 81.2% from your training)
  explained_variance?: number; // Same as R² usually
  
  // Model info
  lastTrained: string;
  modelVersion?: string;
  featuresUsed?: number;
  
  // Feature importance
  featureImportance: {
    population: number;
    base_waste: number;
    rainfall: number;
    temperature: number;
    market_day: number;
    day_of_week?: number;
    month?: number;
  } & Record<string, number>; // Allow additional features with number values
  
  // NEW: Volume Risk Thresholds
  volumeRiskThresholds?: {
    p70: number; // 3,246kg - Moderate threshold
    p90: number; // 13,128kg - High threshold
  };
  
  // Additional info
  forecasting?: string;
  supportsDateRange?: boolean;
  barangaysCovered?: number;
}

export interface Barangay {
  id: string;
  name: string;
  population: number;
  populationDensity?: number;
  totalWaste?: number;
  binCapacity?: number;
  hasMarket?: boolean;
  floodRisk?: 'low' | 'medium' | 'high';
  collectionFrequency?: string;
  area?: number;
  latitude?: number;
  longitude?: number;
}

export interface WeatherData {
  rainfall: number; // mm
  temperature: number; // °C
  humidity?: number; // %
  windSpeed?: number; // km/h
  date: string;
  source?: string;
}

export interface EventData {
  name: string;
  type: 'fiesta' | 'holiday' | 'market' | 'special';
  dates: string[];
  affectedBarangays: string[] | 'all';
  wasteMultiplier: number;
  description?: string;
}

export interface MLModelInfo {
  name: string;
  version: string;
  algorithm: string;
  trainedDate: string;
  performance: {
    r2: number;
    mse: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  };
  features: string[];
  hyperparameters: Record<string, any>;
}

// NEW: Volume Risk Category type
export type VolumeRiskCategory = 'Normal Volume' | 'Moderate Volume' | 'High Volume';

export interface VolumeRiskInfo {
  category: VolumeRiskCategory;
  color: string;
  icon: string;
  action: string;
  description: string;
  thresholds: {
    min?: number;
    max?: number;
  };
}

// Volume risk configuration
export const VOLUME_RISK_CONFIG: Record<VolumeRiskCategory, VolumeRiskInfo> = {
  'Normal Volume': {
    category: 'Normal Volume',
    color: '#34c759', // Green
    icon: '✅',
    action: 'Standard collection schedule',
    description: 'Waste volume within normal range',
    thresholds: { max: 3246 } // Below P70
  },
  'Moderate Volume': {
    category: 'Moderate Volume',
    color: '#ff9500', // Orange
    icon: '📈',
    action: 'Monitor closely, consider extra collection',
    description: 'Waste volume above 70th percentile',
    thresholds: { min: 3246, max: 13128 } // Between P70-P90
  },
  'High Volume': {
    category: 'High Volume',
    color: '#ff3b30', // Red
    icon: '⚠️',
    action: 'Immediate intervention required',
    description: 'Waste volume above 90th percentile',
    thresholds: { min: 13128 } // Above P90
  }
};

// NEW: Analytics Summary
export interface AnalyticsSummary {
  totalBarangays: number;
  highRiskCount: number;
  moderateRiskCount: number;
  safeCount: number;
  totalVolume: number;
  averageConfidence: number;
  volumeRiskBreakdown: {
    highVolume: number;
    moderateVolume: number;
    normalVolume: number;
  };
  topBarangays: {
    highestVolume: { name: string; volume: number }[];
    highestRisk: { name: string; risk: RiskLevel }[];
  };
}

// NEW: Prediction History
export interface PredictionHistory {
  barangayId: string;
  barangayName: string;
  predictions: {
    date: string;
    predictedVolume: number;
    actualVolume?: number;
    accuracy?: number;
    overflowRisk: RiskLevel;
    volumeRisk?: VolumeRiskCategory;
  }[];
  averageVolume: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}