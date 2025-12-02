import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { usePredictions } from '@/contexts/PredictionContext';
import { BARANGAYS, RISK_COLORS, RISK_LABELS } from '@/constants/barangays';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react-native';
import { Prediction, RiskLevel } from '@/constants/types';

type SortOption = 'risk' | 'volume' | 'name';

export default function PredictionsScreen() {
  const { predictions } = usePredictions();
  const [sortBy, setSortBy] = useState<SortOption>('risk');

  const getSortedPredictions = (): Prediction[] => {
    const sorted = [...predictions];

    switch (sortBy) {
      case 'risk':
        const riskOrder: Record<RiskLevel, number> = { high: 0, moderate: 1, safe: 2 };
        return sorted.sort((a, b) => riskOrder[a.overflowRisk] - riskOrder[b.overflowRisk]);
      case 'volume':
        return sorted.sort((a, b) => b.predictedVolume - a.predictedVolume);
      case 'name':
        return sorted.sort((a, b) => a.barangayName.localeCompare(b.barangayName));
      default:
        return sorted;
    }
  };

  const sortedPredictions = getSortedPredictions();

  const SortButton = ({ option, label }: { option: SortOption; label: string }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === option && styles.sortButtonActive,
      ]}
      onPress={() => setSortBy(option)}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortBy === option && styles.sortButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const PredictionCard = ({ prediction }: { prediction: Prediction }) => {
    const barangay = BARANGAYS.find((b) => b.id === prediction.barangayId);
    if (!barangay) return null;

    const capacityPercentage = (prediction.predictedVolume / barangay.binCapacity) * 100;
    const riskColor = RISK_COLORS[prediction.overflowRisk];

    return (
      <View style={styles.predictionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.barangayName}>{prediction.barangayName}</Text>
          <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
            <Text style={styles.riskText}>{RISK_LABELS[prediction.overflowRisk]}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Regression Output</Text>
              <Text style={styles.metricValue}>
                {prediction.predictedVolume.toLocaleString()} kg
              </Text>
              <Text style={styles.metricSubtext}>Predicted volume</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Classification</Text>
              <Text style={[styles.metricValue, { color: riskColor }]}>
                {capacityPercentage.toFixed(0)}%
              </Text>
              <Text style={styles.metricSubtext}>Capacity used</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(capacityPercentage, 100)}%`,
                    backgroundColor: riskColor,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Activity size={16} color="#6b7280" />
              <Text style={styles.statLabel}>Confidence</Text>
              <Text style={styles.statValue}>
                {(prediction.confidence * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.statBox}>
              <TrendingUp size={16} color="#6b7280" />
              <Text style={styles.statLabel}>Capacity</Text>
              <Text style={styles.statValue}>
                {barangay.binCapacity.toLocaleString()} kg
              </Text>
            </View>
            <View style={styles.statBox}>
              <TrendingDown size={16} color="#6b7280" />
              <Text style={styles.statLabel}>Overflow Risk</Text>
              <Text style={styles.statValue}>
                {(prediction.overflowProbability * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Top Contributing Features</Text>
            {prediction.factors.slice(0, 3).map((factor, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureName}>{factor.feature}</Text>
                <View style={styles.featureRight}>
                  <Text style={styles.featureValue}>{factor.value}</Text>
                  <View style={styles.importanceBar}>
                    <View
                      style={[
                        styles.importanceFill,
                        { width: `${factor.importance * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.importanceText}>
                    {(factor.importance * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'ML Predictions',
          headerStyle: { backgroundColor: '#3b82f6' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Random Forest Predictions</Text>
        <Text style={styles.headerSubtitle}>
          Regression + Classification Results
        </Text>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <SortButton option="risk" label="Risk Level" />
          <SortButton option="volume" label="Volume" />
          <SortButton option="name" label="Name" />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {sortedPredictions.map((prediction) => (
          <PredictionCard key={prediction.barangayId} prediction={prediction} />
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
  },
  sortContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sortLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  predictionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  barangayName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cardContent: {
    padding: 16,
  },
  metricRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#111827',
  },
  featuresContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureName: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  featureRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  featureValue: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500' as const,
    width: 70,
    textAlign: 'right',
  },
  importanceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  importanceFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  importanceText: {
    fontSize: 11,
    color: '#6b7280',
    width: 35,
  },
  bottomPadding: {
    height: 24,
  },
});
