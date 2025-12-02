import { useState, useEffect, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Prediction, ModelMetrics } from '@/constants/types';
import { generatePredictions, getModelMetrics } from '@/constants/mlService';
import { BARANGAYS } from '@/constants/barangays';

export const [PredictionProvider, usePredictions] = createContextHook(() => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadPredictions = () => {
    setIsLoading(true);
    console.log('[ML Service] Generating predictions...');
    
    setTimeout(() => {
      const newPredictions = generatePredictions();
      const modelMetrics = getModelMetrics();
      
      setPredictions(newPredictions);
      setMetrics(modelMetrics);
      setLastUpdate(new Date().toISOString());
      setIsLoading(false);
      
      console.log('[ML Service] Predictions generated:', newPredictions.length);
    }, 800);
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const highRiskBarangays = useMemo(() => {
    return predictions.filter((p) => p.overflowRisk === 'high');
  }, [predictions]);

  const moderateRiskBarangays = useMemo(() => {
    return predictions.filter((p) => p.overflowRisk === 'moderate');
  }, [predictions]);

  const safeBarangays = useMemo(() => {
    return predictions.filter((p) => p.overflowRisk === 'safe');
  }, [predictions]);

  const totalPredictedVolume = useMemo(() => {
    return predictions.reduce((sum, p) => sum + p.predictedVolume, 0);
  }, [predictions]);

  const averageCapacityUtilization = useMemo(() => {
    if (predictions.length === 0) return 0;
    
    const totalUtilization = predictions.reduce((sum, p) => {
      const barangay = BARANGAYS.find((b) => b.id === p.barangayId);
      if (!barangay) return sum;
      return sum + (p.predictedVolume / barangay.binCapacity);
    }, 0);
    
    return (totalUtilization / predictions.length) * 100;
  }, [predictions]);

  const getPredictionById = (barangayId: string): Prediction | undefined => {
    return predictions.find((p) => p.barangayId === barangayId);
  };

  return {
    predictions,
    metrics,
    isLoading,
    lastUpdate,
    highRiskBarangays,
    moderateRiskBarangays,
    safeBarangays,
    totalPredictedVolume,
    averageCapacityUtilization,
    getPredictionById,
    refreshPredictions: loadPredictions,
  };
});
