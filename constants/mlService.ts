import { BARANGAYS } from '@/constants/barangays';
import {
  Prediction,
  RiskLevel,
  FeatureImportance,
  ModelMetrics,
  WeatherData,
  EventData,
  HistoricalData,
} from '@/constants/types';

function getRandomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function generateWeatherData(date: string): WeatherData {
  const month = new Date(date).getMonth();
  const isRainySeason = month >= 5 && month <= 10;
  
  return {
    date,
    rainMm: isRainySeason ? getRandomInRange(5, 45) : getRandomInRange(0, 15),
    temperature: getRandomInRange(24, 32),
    humidity: getRandomInRange(60, 90),
  };
}

function generateEventData(date: string, barangayId: string): EventData {
  const dayOfWeek = new Date(date).getDay();
  const dayOfMonth = new Date(date).getDate();
  
  const isMarketDay = dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 6;
  
  const fiestaMap: Record<string, number> = {
    'brgy-001': 16,
    'brgy-002': 20,
    'brgy-003': 8,
    'brgy-004': 15,
    'brgy-005': 24,
  };
  
  const isFiesta = fiestaMap[barangayId] === dayOfMonth;
  
  return {
    date,
    isMarketDay,
    isFiesta,
    eventName: isFiesta ? 'Barangay Fiesta' : undefined,
  };
}

function calculateBaseVolume(
  barangay: typeof BARANGAYS[0],
  weather: WeatherData,
  events: EventData
): number {
  let baseVolume = barangay.populationDensity * 0.3;
  
  if (events.isMarketDay) {
    baseVolume *= 1.4;
  }
  
  if (events.isFiesta) {
    baseVolume *= 2.1;
  }
  
  if (weather.rainMm > 20) {
    baseVolume *= 0.85;
  } else if (weather.rainMm > 10) {
    baseVolume *= 0.95;
  }
  
  const weekendFactor = [0, 6].includes(new Date().getDay()) ? 1.15 : 1.0;
  baseVolume *= weekendFactor;
  
  const noise = getRandomInRange(0.85, 1.15);
  baseVolume *= noise;
  
  return Math.round(baseVolume);
}

function determineRiskLevel(
  predictedVolume: number,
  binCapacity: number
): { risk: RiskLevel; probability: number } {
  const ratio = predictedVolume / binCapacity;
  
  if (ratio >= 0.95) {
    return { risk: 'high', probability: Math.min(0.95, ratio) };
  } else if (ratio >= 0.75) {
    return { risk: 'moderate', probability: ratio };
  } else {
    return { risk: 'safe', probability: 1 - ratio };
  }
}

function generateFeatureImportance(
  barangay: typeof BARANGAYS[0],
  weather: WeatherData,
  events: EventData,
  pastVolume: number
): FeatureImportance[] {
  const features: FeatureImportance[] = [
    {
      feature: 'Past Volume (7-day avg)',
      importance: 0.28,
      value: `${pastVolume} kg`,
    },
    {
      feature: 'Population Density',
      importance: 0.22,
      value: `${barangay.populationDensity}/km²`,
    },
    {
      feature: 'Rainfall',
      importance: 0.18,
      value: `${weather.rainMm.toFixed(1)} mm`,
    },
    {
      feature: 'Market Day',
      importance: events.isMarketDay ? 0.15 : 0.05,
      value: events.isMarketDay ? 'Yes' : 'No',
    },
    {
      feature: 'Fiesta Event',
      importance: events.isFiesta ? 0.12 : 0.03,
      value: events.isFiesta ? 'Yes' : 'No',
    },
    {
      feature: 'Temperature',
      importance: 0.08,
      value: `${weather.temperature.toFixed(1)}°C`,
    },
    {
      feature: 'Day of Week',
      importance: 0.07,
      value: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
    },
  ];
  
  return features.sort((a, b) => b.importance - a.importance);
}

export function generatePredictions(): Prediction[] {
  const tomorrow = getTomorrowString();
  
  return BARANGAYS.map((barangay) => {
    const weather = generateWeatherData(tomorrow);
    const events = generateEventData(tomorrow, barangay.id);
    
    const pastVolume = calculateBaseVolume(
      barangay,
      generateWeatherData(getTodayString()),
      generateEventData(getTodayString(), barangay.id)
    );
    
    const predictedVolume = calculateBaseVolume(barangay, weather, events);
    
    const { risk, probability } = determineRiskLevel(
      predictedVolume,
      barangay.binCapacity
    );
    
    const confidence = getRandomInRange(0.82, 0.96);
    
    const factors = generateFeatureImportance(
      barangay,
      weather,
      events,
      pastVolume
    );
    
    return {
      barangayId: barangay.id,
      barangayName: barangay.name,
      date: tomorrow,
      predictedVolume,
      overflowRisk: risk,
      overflowProbability: probability,
      confidence,
      factors,
    };
  });
}

export function getModelMetrics(): ModelMetrics {
  return {
    regression: {
      mae: 87.3,
      rmse: 124.6,
      r2: 0.87,
    },
    classification: {
      accuracy: 0.91,
      precision: 0.88,
      recall: 0.86,
      f1Score: 0.87,
    },
  };
}

export function generateHistoricalData(barangayId: string, days: number = 30): HistoricalData[] {
  const barangay = BARANGAYS.find((b) => b.id === barangayId);
  if (!barangay) return [];
  
  const data: HistoricalData[] = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const weather = generateWeatherData(dateStr);
    const events = generateEventData(dateStr, barangayId);
    
    const actualVolume = calculateBaseVolume(barangay, weather, events);
    const predictedVolume = actualVolume * getRandomInRange(0.92, 1.08);
    
    data.push({
      date: dateStr,
      barangayId,
      actualVolume,
      predictedVolume: Math.round(predictedVolume),
      weather,
      events,
    });
  }
  
  return data;
}

export function getPredictionForBarangay(barangayId: string): Prediction | null {
  const predictions = generatePredictions();
  return predictions.find((p) => p.barangayId === barangayId) || null;
}
