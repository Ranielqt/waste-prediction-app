import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { usePredictions } from '@/contexts/PredictionContext';
import { BARANGAYS, RISK_COLORS, RISK_LABELS } from '@/constants/barangays';
import { AlertTriangle, TrendingUp, MapPin, RefreshCw, CloudRain, Thermometer, Droplets } from 'lucide-react-native';
import { Prediction } from '@/constants/types';

export default function DashboardScreen() {
  const {
    predictions,
    isLoading,
    highRiskBarangays,
    moderateRiskBarangays,
    safeBarangays,
    totalPredictedVolume,
    averageCapacityUtilization,
    refreshPredictions,
  } = usePredictions();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    color,
    icon: Icon 
  }: { 
    title: string; 
    value: string; 
    subtitle: string; 
    color: string;
    icon: typeof AlertTriangle;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const WeatherCard = () => {
    if (predictions.length === 0) return null;
    
    const weatherFactor = predictions[0].factors.find(f => f.feature === 'Rainfall');
    const tempFactor = predictions[0].factors.find(f => f.feature === 'Temperature');
    const humidityValue = '75%';
    
    return (
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <CloudRain size={24} color="#3b82f6" />
          <Text style={styles.weatherTitle}>Weather Conditions</Text>
        </View>
        <View style={styles.weatherGrid}>
          <View style={styles.weatherItem}>
            <CloudRain size={20} color="#3b82f6" />
            <Text style={styles.weatherLabel}>Rainfall</Text>
            <Text style={styles.weatherValue}>{weatherFactor?.value || 'N/A'}</Text>
          </View>
          <View style={styles.weatherItem}>
            <Thermometer size={20} color="#ef4444" />
            <Text style={styles.weatherLabel}>Temperature</Text>
            <Text style={styles.weatherValue}>{tempFactor?.value || 'N/A'}</Text>
          </View>
          <View style={styles.weatherItem}>
            <Droplets size={20} color="#06b6d4" />
            <Text style={styles.weatherLabel}>Humidity</Text>
            <Text style={styles.weatherValue}>{humidityValue}</Text>
          </View>
        </View>
        <Text style={styles.weatherNote}>
          Weather data influences garbage accumulation predictions
        </Text>
      </View>
    );
  };

  const BarangayCard = ({ prediction }: { prediction: Prediction }) => {
    const barangay = BARANGAYS.find((b) => b.id === prediction.barangayId);
    if (!barangay) return null;

    const capacityPercentage = (prediction.predictedVolume / barangay.binCapacity) * 100;
    const riskColor = RISK_COLORS[prediction.overflowRisk];
    
    const weatherFactor = prediction.factors.find(f => f.feature === 'Rainfall');

    return (
      <View style={styles.barangayCard}>
        <View style={styles.barangayHeader}>
          <View style={styles.barangayTitleRow}>
            <MapPin size={18} color="#374151" />
            <Text style={styles.barangayName}>{prediction.barangayName}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
            <Text style={styles.riskBadgeText}>
              {RISK_LABELS[prediction.overflowRisk]}
            </Text>
          </View>
        </View>

        <View style={styles.volumeRow}>
          <Text style={styles.volumeLabel}>Predicted Volume</Text>
          <Text style={styles.volumeValue}>
            {prediction.predictedVolume.toLocaleString()} kg
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(capacityPercentage, 100)}%`,
                  backgroundColor: riskColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {capacityPercentage.toFixed(0)}% of capacity
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Capacity: {barangay.binCapacity.toLocaleString()} kg
          </Text>
          <Text style={styles.confidenceText}>
            Confidence: {(prediction.confidence * 100).toFixed(0)}%
          </Text>
        </View>
        
        {weatherFactor && (
          <View style={styles.weatherBadge}>
            <CloudRain size={14} color="#3b82f6" />
            <Text style={styles.weatherBadgeText}>{weatherFactor.value}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerStyle: { backgroundColor: '#10b981' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' as const },
          headerRight: () => (
            <TouchableOpacity
              onPress={refreshPredictions}
              disabled={isLoading}
              style={styles.refreshButton}
            >
              <RefreshCw size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshPredictions} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Waste Management Prediction</Text>
          <Text style={styles.headerSubtitle}>Cagayan de Oro City • {predictions.length} Barangays</Text>
          {predictions.length > 0 && (
            <Text style={styles.predictionDate}>
              Forecast for {formatDate(predictions[0].date)} • With Weather Data
            </Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="High Risk"
            value={highRiskBarangays.length.toString()}
            subtitle="Overflow likely"
            color={RISK_COLORS.high}
            icon={AlertTriangle}
          />
          <StatCard
            title="Moderate"
            value={moderateRiskBarangays.length.toString()}
            subtitle="Monitor closely"
            color={RISK_COLORS.moderate}
            icon={AlertTriangle}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Volume"
            value={`${Math.round(totalPredictedVolume / 1000)} tons`}
            subtitle="Predicted tomorrow"
            color="#3b82f6"
            icon={TrendingUp}
          />
          <StatCard
            title="Avg. Utilization"
            value={`${averageCapacityUtilization.toFixed(0)}%`}
            subtitle="Across all barangays"
            color="#8b5cf6"
            icon={TrendingUp}
          />
        </View>

        <WeatherCard />

        {highRiskBarangays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ High Risk Barangays</Text>
            {highRiskBarangays.map((prediction) => (
              <BarangayCard key={prediction.barangayId} prediction={prediction} />
            ))}
          </View>
        )}

        {moderateRiskBarangays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔶 Moderate Risk</Text>
            {moderateRiskBarangays.map((prediction) => (
              <BarangayCard key={prediction.barangayId} prediction={prediction} />
            ))}
          </View>
        )}

        {safeBarangays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Safe Barangays</Text>
            {safeBarangays.map((prediction) => (
              <BarangayCard key={prediction.barangayId} prediction={prediction} />
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Random Forest ML • Updated {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  refreshButton: {
    marginRight: 8,
    padding: 4,
  },
  header: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#d1fae5',
    marginBottom: 8,
  },
  predictionDate: {
    fontSize: 14,
    color: '#d1fae5',
    fontWeight: '500' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  barangayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  barangayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  barangayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barangayName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#111827',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  volumeValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
  },
  weatherGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  weatherNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  weatherBadgeText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500' as const,
  },
});
