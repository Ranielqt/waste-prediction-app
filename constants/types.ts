export type RiskLevel = 'safe' | 'moderate' | 'high';


export interface Barangay {
  id: string;
  name: string;
  population: number;
  populationDensity: number;
  binCapacity: number;
  latitude: number;
  longitude: number;
}


export interface WeatherData {
  date: string;
  rainMm: number;
  temperature: number;
  humidity: number;
}


export interface EventData {
  date: string;
  isMarketDay: boolean;
  isFiesta: boolean;
  eventName?: string;
}


export interface GarbageRecord {
  date: string;
  barangayId: string;
  volume: number;
  collected: boolean;
}


export interface Prediction {
  barangayId: string;
  barangayName: string;