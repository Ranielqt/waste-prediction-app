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
import { getHistoricalWaste } from './historicalWaste';
import { AlertTriangle, TrendingUp, MapPin, RefreshCw, CloudRain } from 'lucide-react-native';
import { Prediction } from '@/constants/types';

export default function DashboardScreen() {
  const {
    predictions,
    isLoading,
    highRiskBarangays,
    moderateRiskBarangays,
    safeBarangays,
    totalPredictedVolume,
    refreshPredictions,
  } = usePredictions();

    // Add this right after your usePredictions() call
  console.log('=== DASHBOARD DEBUG ===');
  console.log('Total predictions:', predictions?.length);
  console.log('High risk count:', highRiskBarangays?.length);
  console.log('Moderate risk count:', moderateRiskBarangays?.length);
  console.log('Safe count:', safeBarangays?.length);

  if (predictions && predictions.length > 0) {
    console.log('Sample prediction risks:');
    predictions.slice(0, 5).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.barangayName}: ${p.overflowRisk}`);
    });
    
    // Check what risk values actually exist
    const uniqueRisks = [...new Set(predictions.map(p => p.overflowRisk))];
    console.log('Unique risk values in predictions:', uniqueRisks);
  }

  // Debug risk distribution
  React.useEffect(() => {
    if (predictions && predictions.length > 0) {
      console.log('=== RISK DISTRIBUTION ===');
      const risks = predictions.reduce((acc: Record<string, number>, p) => {
        acc[p.overflowRisk] = (acc[p.overflowRisk] || 0) + 1;
        return acc;
      }, {});
      console.log('Risk counts:', risks);
      
      // Check if all are high
      const allHigh = predictions.every(p => p.overflowRisk === 'high');
      if (allHigh) {
        console.log('⚠️ WARNING: All barangays marked as HIGH risk');
        console.log('Check ML model risk classifier in api.py');
      }
    }
  }, [predictions]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Today';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      });
    } catch {
      return 'Today';
    }
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

  const BarangayCard = ({ prediction }: { prediction: Prediction }) => {
    if (!prediction) return null;
    
    const barangay = BARANGAYS.find((b) => b.id === prediction.barangayId);
    if (!barangay) return null;

    const riskColor = RISK_COLORS[prediction.overflowRisk];
    
    // Use CSV historical data
    const historicalWaste = getHistoricalWaste(barangay.name);
    const increaseAmount = prediction.predictedVolume - historicalWaste;
    const increasePercentage = historicalWaste > 0 ? 
      (increaseAmount / historicalWaste) * 100 : 0;

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

        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Historical</Text>
            <Text style={styles.comparisonValue}>
              {historicalWaste.toLocaleString()} kg
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonLabel}>Change</Text>
            <Text style={[
              styles.comparisonValue, 
              { color: increaseAmount >= 0 ? '#ef4444' : '#10b981' }
            ]}>
              {increaseAmount >= 0 ? '+' : ''}{increaseAmount.toLocaleString()} kg
              {' '}({increaseAmount >= 0 ? '+' : ''}{increasePercentage.toFixed(0)}%)
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Confidence: {(prediction.confidence * 100).toFixed(0)}%
          </Text>
          {prediction.events && prediction.events.length > 0 && (
            <View style={styles.eventsBadge}>
              <CloudRain size={12} color="#3b82f6" />
              <Text style={styles.eventsText}>
                {prediction.events.length} event{prediction.events.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Calculate average increase
  const avgIncrease = predictions && predictions.length > 0 ? 
    predictions.reduce((sum, p) => {
      const barangay = BARANGAYS.find(b => b.id === p.barangayId);
      const historical = barangay ? getHistoricalWaste(barangay.name) : 0;
      return sum + (historical > 0 ? ((p.predictedVolume - historical) / historical) * 100 : 0);
    }, 0) / predictions.length : 0;

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
          <Text style={styles.headerSubtitle}>Cagayan de Oro City • {predictions?.length || 0} Barangays</Text>
          {predictions && predictions.length > 0 && predictions[0]?.date && (
            <Text style={styles.predictionDate}>
              Forecast for {formatDate(predictions[0].date)} • Using Historical CSV Data
            </Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="High Risk"
            value={highRiskBarangays?.length?.toString() || '0'}
            subtitle="Overflow likely"
            color={RISK_COLORS.high}
            icon={AlertTriangle}
          />
          <StatCard
            title="Moderate"
            value={moderateRiskBarangays?.length?.toString() || '0'}
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
            title="Avg. Increase"
            value={`${avgIncrease.toFixed(0)}%`}
            subtitle="From historical"
            color="#8b5cf6"
            icon={TrendingUp}
          />
        </View>

        {highRiskBarangays && highRiskBarangays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ High Risk Barangays ({highRiskBarangays.length})</Text>
            {highRiskBarangays.map((prediction) => (
              <BarangayCard key={prediction.barangayId} prediction={prediction} />
            ))}
          </View>
        )}

        {moderateRiskBarangays && moderateRiskBarangays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔶 Moderate Risk ({moderateRiskBarangays.length})</Text>
            {moderateRiskBarangays.map((prediction) => (
              <BarangayCard key={prediction.barangayId} prediction={prediction} />
            ))}
          </View>
        )}

        {safeBarangays && safeBarangays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Safe Barangays ({safeBarangays.length})</Text>
            {safeBarangays.map((prediction) => (
              <BarangayCard key={prediction.barangayId} prediction={prediction} />
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Using CSV Historical Data • ML Model v1.0
          </Text>
          <Text style={styles.footerTimestamp}>
            Updated {new Date().toLocaleTimeString()}
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
    marginBottom: 12,
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
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  comparisonItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e293b',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  eventsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  eventsText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500' as const,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerTimestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
});