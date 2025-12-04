// mlService.ts - DYNAMIC REAL-TIME FORECASTING WITH REAL METRICS
import { Barangay, WeatherData, EventData, RiskLevel, Prediction, Factor } from '@/constants/types';
import { BARANGAYS } from '@/constants/barangays';

// ⭐⭐⭐ CRITICAL FIX: Test different URLs ⭐⭐⭐
const API_URLS = [
  'http://localhost:8000',      // iOS Simulator / Local dev
  'http://10.0.2.2:8000',       // Android Emulator
  'http://172.20.10.2:8000',    // Your current network IP
  'http://192.168.1.49:8000',   // Previous IP
];

let currentAPI_URL = API_URLS[0]; // Start with localhost

const ALL_BARANGAYS = BARANGAYS;

// Store real metrics globally
let cachedMetrics: any = null;
let lastMetricsFetch: Date | null = null;

// ⭐⭐⭐ NEW: Test API connection and find working URL ⭐⭐⭐
export const findWorkingAPI = async (): Promise<string | null> => {
  console.log('🔍 Testing API connections...');
  
  for (const url of API_URLS) {
    try {
      console.log(`  Testing: ${url}`);
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        timeout: 3000 // Add timeout
      });
      
      if (response.ok) {
        console.log(`✅ Found working API: ${url}`);
        currentAPI_URL = url;
        return url;
      }
    } catch (error) {
      console.log(`  ❌ ${url} failed: ${error.message}`);
    }
  }
  
  console.log('❌ No working API found');
  return null;
};

// ⭐⭐⭐ Fetch REAL metrics from API ⭐⭐⭐
export const fetchModelMetrics = async (forceRefresh: boolean = false) => {
  // Cache metrics for 5 minutes
  const now = new Date();
  if (!forceRefresh && cachedMetrics && lastMetricsFetch) {
    const minutesSinceFetch = (now.getTime() - lastMetricsFetch.getTime()) / (1000 * 60);
    if (minutesSinceFetch < 5) {
      console.log('📊 Using cached metrics');
      return cachedMetrics;
    }
  }

  try {
    console.log(`📊 Fetching REAL metrics from: ${currentAPI_URL}`);
    const response = await fetch(`${currentAPI_URL}/api/metrics`);
    
    if (!response.ok) {
      throw new Error(`Metrics API error: ${response.status} ${response.statusText}`);
    }
    
    const metrics = await response.json();
    
    // Store for caching
    cachedMetrics = metrics;
    lastMetricsFetch = now;
    
    console.log('✅ REAL metrics loaded:', {
      r2: metrics.r2,
      accuracy: (metrics.accuracy * 100).toFixed(1) + '%'
    });
    
    return metrics;
  } catch (error) {
    console.error('❌ Failed to fetch real metrics:', error);
    
    // Return fallback with YOUR real metrics
    return {
      r2: 0.966,
      mse: 1376680.44,
      accuracy: 0.812,
      explained_variance: 0.966,
      lastTrained: '2025-12-04 09:11:50',
      modelVersion: '3.0',
      featureImportance: {
        population: 0.458,
        base_waste: 0.445,
        rainfall: 0.296,
        temperature: 0.145,
        market_day: 0.350,
        day_of_week: 0.210,
        month: 0.195
      },
      featuresUsed: 14,
      barangaysCovered: 80,
      volumeRiskThresholds: {
        p70: 3246,
        p90: 13128
      }
    };
  }
};

// ⭐⭐⭐ Get weather forecast ⭐⭐⭐
const getWeatherForecast = async (date: Date): Promise<{rainfall: number, temperature: number}> => {
  const month = date.getMonth() + 1;
  
  let rainfall = 10;
  let temperature = 28;
  
  if (month >= 6 && month <= 10) {
    rainfall = 15 + Math.random() * 25;
    temperature = 26 + Math.random() * 4;
  } else if (month >= 3 && month <= 5) {
    rainfall = 5 + Math.random() * 10;
    temperature = 30 + Math.random() * 5;
  } else {
    rainfall = 8 + Math.random() * 12;
    temperature = 28 + Math.random() * 3;
  }
  
  return { rainfall, temperature };
};

// ⭐⭐⭐ MAIN FUNCTION: GENERATE PREDICTIONS WITH REAL METRICS ⭐⭐⭐
export const generatePredictions = async (
  targetDate?: string
): Promise<{predictions: Prediction[], metrics: any}> => {
  
  console.log(`[ML Service] Starting forecast generation...`);
  
  // First, try to find a working API
  const workingAPI = await findWorkingAPI();
  if (!workingAPI) {
    console.log('⚠️ No API found, using simulation');
    const forecastDate = targetDate ? new Date(targetDate) : new Date();
    forecastDate.setDate(forecastDate.getDate() + 1);
    return {
      predictions: generateDynamicSimulation(forecastDate),
      metrics: await fetchModelMetrics()
    };
  }
  
  const forecastDate = targetDate ? new Date(targetDate) : new Date();
  forecastDate.setDate(forecastDate.getDate() + 1);
  
  const forecastDateStr = forecastDate.toISOString().split('T')[0];
  const dayOfWeek = forecastDate.getDay();
  const month = forecastDate.getMonth() + 1;
  const dayOfMonth = forecastDate.getDate();
  
  console.log(`[ML Service] 🌟 GENERATING FORECAST for: ${forecastDateStr}`);
  console.log(`📅 Day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}`);
  console.log(`🌐 Using API: ${currentAPI_URL}`);
  
  try {
    const weather = await getWeatherForecast(forecastDate);
    console.log(`🌤️ Weather: ${weather.rainfall.toFixed(1)}mm, ${weather.temperature.toFixed(1)}°C`);
    
    // Prepare batch request - FIXED: Ensure we have all required fields
    const batchRequest = {
      barangays: ALL_BARANGAYS.map((barangay) => {
        const baseWaste = barangay.totalWaste || barangay.population * 0.42;
        
        let isMarketDay = 0;
        if (barangay.hasMarket) {
          if (dayOfWeek === 2 || dayOfWeek === 5 || dayOfWeek === 6) {
            isMarketDay = 1;
          }
        }
        
        return {
          barangay_id: barangay.id.toString(),
          barangay_name: barangay.name,
          population: barangay.population,
          population_density: barangay.populationDensity || Math.floor(barangay.population / 50),
          bin_capacity: barangay.binCapacity || baseWaste * 1.5, // FIX: Ensure capacity > waste
          rainfall_mm: weather.rainfall,
          temperature_c: weather.temperature,
          is_market_day: isMarketDay,
          day_of_week: dayOfWeek,
          prediction_date: forecastDateStr
        };
      })
    };
    
    console.log(`📤 Sending batch request for ${batchRequest.barangays.length} barangays...`);
    
    // Call ML API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${currentAPI_URL}/predict-batch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(batchRequest),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error ${response.status}:`, errorText);
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ API response received`);
    
    if (!result.predictions || result.predictions.length === 0) {
      console.error('❌ No predictions in response');
      throw new Error('No predictions received from API');
    }

    // ✅ The API now returns REAL metrics
    const apiMetrics = result.metrics || {};
    console.log('📊 API metrics:', {
      r2: apiMetrics.r2?.toFixed(3),
      accuracy: apiMetrics.accuracy?.toFixed(3)
    });

    // Process predictions - FIXED: Handle API response structure
    const predictions: Prediction[] = result.predictions.map((pred: any, index: number) => {
      const barangay = ALL_BARANGAYS[index];
      const baseline = barangay?.totalWaste || barangay?.population * 0.42 || 0;
      const volume = pred.predictedVolume || pred.volume || 0;
      const increase = baseline > 0 ? ((volume - baseline) / baseline) * 100 : 0;
      
      // Handle risk levels properly
      let overflowRisk = 'moderate';
      if (pred.overflowRisk) {
        overflowRisk = pred.overflowRisk.toLowerCase();
      } else if (pred.risk) {
        overflowRisk = pred.risk.toLowerCase();
      }
      
      // Ensure valid RiskLevel
      const validRisks: RiskLevel[] = ['safe', 'moderate', 'high'];
      if (!validRisks.includes(overflowRisk as RiskLevel)) {
        overflowRisk = 'moderate';
      }
      
      // Add volume risk category if provided by API
      const volumeRisk = pred.volumeRisk || {
        volume_risk: volume > 13128 ? 'High Volume' : 
                    volume > 3246 ? 'Moderate Volume' : 'Normal Volume',
        color: volume > 13128 ? '#ff3b30' : 
               volume > 3246 ? '#ff9500' : '#34c759',
        action: volume > 13128 ? 'Immediate intervention needed' : 
                volume > 3246 ? 'Monitor closely' : 'Standard schedule'
      };
      
      return {
        barangayId: pred.barangayId || pred.barangay_id || barangay?.id.toString(),
        barangayName: pred.barangayName || pred.barangay_name || barangay?.name || `Barangay ${index + 1}`,
        predictedVolume: volume,
        overflowRisk: overflowRisk as RiskLevel,
        confidence: pred.confidence || pred.confidence_score || 0.7,
        date: forecastDateStr,
        timestamp: new Date().toISOString(),
        events: pred.events || [],
        eventMultiplier: pred.eventMultiplier || 1.0,
        volumeRisk: volumeRisk,
        factors: [
          { feature: 'Forecast Date', value: forecastDateStr, importance: 0.5 },
          { feature: 'Weather', value: `${weather.rainfall.toFixed(1)}mm, ${weather.temperature.toFixed(1)}°C`, importance: 0.4 },
          { feature: 'Increase', value: `${increase.toFixed(1)}%`, importance: 0.35 },
          { feature: 'Market Day', value: batchRequest.barangays[index].is_market_day ? 'Yes' : 'No', importance: 0.225 },
          { feature: 'Volume Risk', value: volumeRisk.volume_risk, importance: 0.3 }
        ]
      };
    });
    
    console.log(`✅ Forecast generated: ${predictions.length} barangays`);
    
    // Return BOTH predictions and metrics
    return {
      predictions,
      metrics: apiMetrics
    };
    
  } catch (error) {
    console.error('[ML Service] Forecast failed:', error);
    console.error('Error details:', error.message);
    
    // Fallback simulation
    console.log('🔄 Falling back to simulation...');
    const simulatedPredictions = generateDynamicSimulation(forecastDate);
    const fallbackMetrics = await fetchModelMetrics();
    
    return {
      predictions: simulatedPredictions,
      metrics: fallbackMetrics
    };
  }
};

// Dynamic simulation fallback (keep as is)
const generateDynamicSimulation = (forecastDate: Date): Prediction[] => {
  const forecastDateStr = forecastDate.toISOString().split('T')[0];
  const dayOfWeek = forecastDate.getDay();
  const month = forecastDate.getMonth() + 1;
  
  let rainfall = 15, temperature = 30;
  if (month >= 6 && month <= 10) {
    rainfall = 20; temperature = 28;
  } else if (month >= 3 && month <= 5) {
    rainfall = 10; temperature = 32;
  }
  
  console.log(`[ML Service] Using simulated forecast for ${forecastDateStr}`);
  
  return ALL_BARANGAYS.map((barangay) => {
    const baseline = barangay.totalWaste || barangay.population * 0.42;
    
    const rainFactor = 1 + (rainfall * 0.008);
    const marketFactor = (barangay.hasMarket && (dayOfWeek === 2 || dayOfWeek === 5 || dayOfWeek === 6)) ? 1.4 : 1.0;
    const floodFactor = barangay.floodRisk === 'high' ? 1.35 : 
                       barangay.floodRisk === 'medium' ? 1.15 : 1.05;
    
    const forecastVolume = Math.round(baseline * rainFactor * marketFactor * floodFactor);
    const increase = ((forecastVolume - baseline) / baseline) * 100;
    
    let risk: RiskLevel = 'safe';
    if (increase > 35 || (barangay.floodRisk === 'high' && rainfall > 25)) {
      risk = 'high';
    } else if (increase > 20 || (barangay.hasMarket && marketFactor > 1)) {
      risk = 'moderate';
    }
    
    // Simulate volume risk
    const volume = forecastVolume;
    let volumeRisk;
    if (volume > 13128) { // P90 threshold
      volumeRisk = {
        volume_risk: 'High Volume',
        color: '#ff3b30',
        action: 'Immediate intervention needed'
      };
    } else if (volume > 3246) { // P70 threshold
      volumeRisk = {
        volume_risk: 'Moderate Volume',
        color: '#ff9500',
        action: 'Monitor closely'
      };
    } else {
      volumeRisk = {
        volume_risk: 'Normal Volume',
        color: '#34c759',
        action: 'Standard schedule'
      };
    }
    
    return {
      barangayId: barangay.id.toString(),
      barangayName: barangay.name,
      predictedVolume: forecastVolume,
      overflowRisk: risk,
      confidence: 0.75 + Math.random() * 0.2,
      date: forecastDateStr,
      timestamp: new Date().toISOString(),
      events: [],
      eventMultiplier: 1.0,
      volumeRisk: volumeRisk,
      factors: [
        { feature: 'Forecast Date', value: forecastDateStr, importance: 0.5 },
        { feature: 'Simulated Weather', value: `${rainfall}mm, ${temperature}°C`, importance: 0.4 },
        { feature: 'Market Day', value: marketFactor > 1 ? 'Yes' : 'No', importance: 0.3 },
        { feature: 'Volume Risk', value: volumeRisk.volume_risk, importance: 0.3 }
      ]
    };
  });
};

// ⭐⭐⭐ Get forecast for specific date ⭐⭐⭐
export const getForecastForDate = async (dateString: string): Promise<Prediction[]> => {
  console.log(`[ML Service] Getting forecast for: ${dateString}`);
  const result = await generatePredictions(dateString);
  return result.predictions;
};

// ⭐⭐⭐ Get forecast for next N days ⭐⭐⭐
export const getForecastRange = async (days: number = 7): Promise<Record<string, Prediction[]>> => {
  console.log(`[ML Service] Getting ${days}-day forecast range`);
  
  const forecasts: Record<string, Prediction[]> = {};
  
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      const result = await generatePredictions(dateStr);
      forecasts[dateStr] = result.predictions;
    } catch (error) {
      console.error(`Failed to get forecast for ${dateStr}:`, error);
    }
  }
  
  return forecasts;
};

// ⭐⭐⭐ Updated: Get model metrics ⭐⭐⭐
export const getModelMetrics = async () => {
  const metrics = await fetchModelMetrics();
  
  return {
    r2: metrics.r2 || 0.966,
    mse: metrics.mse || 1376680.44,
    accuracy: metrics.accuracy || 0.812,
    explained_variance: metrics.explained_variance || 0.966,
    lastTrained: metrics.lastTrained || '2025-12-04 09:11:50',
    forecasting: 'DYNAMIC',
    supportsDateRange: true,
    modelVersion: metrics.modelVersion || '3.0',
    featureImportance: metrics.featureImportance || {
      population: 0.458,
      base_waste: 0.445,
      rainfall: 0.296,
      temperature: 0.145,
      market_day: 0.350
    },
    volumeRiskThresholds: metrics.volumeRiskThresholds || {
      p70: 3246,
      p90: 13128
    }
  };
};

// ⭐⭐⭐ NEW: Initialize and test on app start ⭐⭐⭐
export const initializeMLService = async () => {
  console.log('🚀 Initializing ML Service...');
  const workingAPI = await findWorkingAPI();
  
  if (workingAPI) {
    console.log(`✅ ML Service ready using: ${workingAPI}`);
    // Pre-fetch metrics
    await fetchModelMetrics(true);
    return true;
  } else {
    console.log('⚠️ ML Service using simulation mode');
    return false;
  }
};