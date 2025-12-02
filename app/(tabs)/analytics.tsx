import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { usePredictions } from '@/contexts/PredictionContext';
import { BarChart, Target, TrendingUp, Award, CloudRain } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const { metrics, predictions } = usePredictions();

  if (!metrics) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Analytics',
            headerStyle: { backgroundColor: '#8b5cf6' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' as const },
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      </View>
    );
  }

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: typeof BarChart;
    color: string;
  }) => (
    <View style={styles.metricCard}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
  );

  const ScoreBar = ({ label, score }: { label: string; score: number }) => {
    const percentage = score * 100;
    const color = score >= 0.9 ? '#10b981' : score >= 0.8 ? '#3b82f6' : '#f59e0b';

    return (
      <View style={styles.scoreBarContainer}>
        <View style={styles.scoreBarHeader}>
          <Text style={styles.scoreBarLabel}>{label}</Text>
          <Text style={[styles.scoreBarValue, { color }]}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.scoreBarBg}>
          <View
            style={[
              styles.scoreBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Analytics',
          headerStyle: { backgroundColor: '#8b5cf6' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Model Performance</Text>
        <Text style={styles.headerSubtitle}>Random Forest Metrics</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Regression Metrics</Text>
          <Text style={styles.sectionDescription}>
            Evaluating predicted garbage volume accuracy
          </Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              title="R² Score"
              value={metrics.regression.r2.toFixed(3)}
              subtitle="Variance explained"
              icon={Award}
              color="#8b5cf6"
            />
            <MetricCard
              title="MAE"
              value={`${metrics.regression.mae.toFixed(1)} kg`}
              subtitle="Mean Absolute Error"
              icon={Target}
              color="#3b82f6"
            />
          </View>

          <View style={styles.metricsGrid}>
            <MetricCard
              title="RMSE"
              value={`${metrics.regression.rmse.toFixed(1)} kg`}
              subtitle="Root Mean Squared Error"
              icon={TrendingUp}
              color="#06b6d4"
            />
            <MetricCard
              title="Predictions"
              value={predictions.length.toString()}
              subtitle="Barangays analyzed"
              icon={BarChart}
              color="#10b981"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Regression Interpretation</Text>
            <Text style={styles.infoText}>
              R² = {metrics.regression.r2.toFixed(3)} means the model explains{' '}
              {(metrics.regression.r2 * 100).toFixed(1)}% of the variance in garbage
              volume. MAE of {metrics.regression.mae.toFixed(0)}kg indicates typical
              prediction error.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Classification Metrics</Text>
          <Text style={styles.sectionDescription}>
            Overflow risk prediction performance
          </Text>

          <View style={styles.scoresCard}>
            <ScoreBar label="Accuracy" score={metrics.classification.accuracy} />
            <ScoreBar label="Precision" score={metrics.classification.precision} />
            <ScoreBar label="Recall" score={metrics.classification.recall} />
            <ScoreBar label="F1 Score" score={metrics.classification.f1Score} />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Classification Interpretation</Text>
            <Text style={styles.infoText}>
              Accuracy of {(metrics.classification.accuracy * 100).toFixed(0)}% shows
              overall correctness. Precision ({(metrics.classification.precision * 100).toFixed(0)}%)
              indicates reliability of overflow predictions. Recall ({(metrics.classification.recall * 100).toFixed(0)}%)
              shows how well the model catches actual overflows.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Model Architecture</Text>

          <View style={styles.architectureCard}>
            <View style={styles.architectureRow}>
              <Text style={styles.architectureLabel}>Algorithm</Text>
              <Text style={styles.architectureValue}>Random Forest</Text>
            </View>
            <View style={styles.architectureRow}>
              <Text style={styles.architectureLabel}>Ensemble Type</Text>
              <Text style={styles.architectureValue}>Bagging (Bootstrap)</Text>
            </View>
            <View style={styles.architectureRow}>
              <Text style={styles.architectureLabel}>Estimators</Text>
              <Text style={styles.architectureValue}>100 Decision Trees</Text>
            </View>
            <View style={styles.architectureRow}>
              <Text style={styles.architectureLabel}>Features</Text>
              <Text style={styles.architectureValue}>
                7 input variables (incl. weather)
              </Text>
            </View>
            <View style={styles.architectureRow}>
              <Text style={styles.architectureLabel}>Training Split</Text>
              <Text style={styles.architectureValue}>75% / 25%</Text>
            </View>
            <View style={styles.architectureRow}>
              <Text style={styles.architectureLabel}>Outputs</Text>
              <Text style={styles.architectureValue}>
                Volume (Regression) + Risk (Classification)
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Why Random Forest?</Text>
            <Text style={styles.infoText}>
              Random Forest excels at handling structured tabular data with non-linear
              relationships. It combines multiple decision trees to reduce overfitting
              and provides robust predictions for environmental data with variable
              patterns like weather and events.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌦️ Weather Data Integration</Text>
          <Text style={styles.sectionDescription}>
            How weather influences garbage accumulation predictions
          </Text>

          <View style={styles.weatherIntegrationCard}>
            <View style={styles.weatherFeatureRow}>
              <View style={styles.weatherIconBox}>
                <CloudRain size={20} color="#3b82f6" />
              </View>
              <View style={styles.weatherTextBox}>
                <Text style={styles.weatherFeatureTitle}>Rainfall (mm)</Text>
                <Text style={styles.weatherFeatureDesc}>
                  Heavy rain reduces outdoor waste generation. Light rain increases indoor activities.
                  Importance: ~18%
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherFeatureRow}>
              <View style={styles.weatherIconBox}>
                <TrendingUp size={20} color="#ef4444" />
              </View>
              <View style={styles.weatherTextBox}>
                <Text style={styles.weatherFeatureTitle}>Temperature (°C)</Text>
                <Text style={styles.weatherFeatureDesc}>
                  Higher temperatures increase beverage consumption and disposable packaging.
                  Importance: ~8%
                </Text>
              </View>
            </View>

            <View style={styles.weatherFeatureRow}>
              <View style={styles.weatherIconBox}>
                <Target size={20} color="#06b6d4" />
              </View>
              <View style={styles.weatherTextBox}>
                <Text style={styles.weatherFeatureTitle}>Humidity (%)</Text>
                <Text style={styles.weatherFeatureDesc}>
                  Affects waste decomposition rate and collection frequency.
                  Indirectly influences predictions.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Weather Data Source</Text>
            <Text style={styles.infoText}>
              Real-time weather data from PAGASA (Philippine Atmospheric, Geophysical and 
              Astronomical Services Administration) for Cagayan de Oro City. Historical patterns 
              show rainy season (June-October) reduces waste by 15% on heavy rain days.
            </Text>
          </View>
        </View>

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
    backgroundColor: '#8b5cf6',
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
    color: '#ede9fe',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  scoresCard: {
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
  scoreBarContainer: {
    marginBottom: 16,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBarLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500' as const,
  },
  scoreBarValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scoreBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e40af',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  architectureCard: {
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
  architectureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  architectureLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  architectureValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  bottomPadding: {
    height: 24,
  },
  weatherIntegrationCard: {
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
  weatherFeatureRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  weatherIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherTextBox: {
    flex: 1,
  },
  weatherFeatureTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  weatherFeatureDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});
