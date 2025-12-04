import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { usePredictions } from '@/contexts/PredictionContext'; // ← IMPORT THE CONTEXT

export default function PredictionsScreen() {
  const {
    predictions,            // ← Use shared predictions from context
    isLoading,             // ← Use shared loading state
    refreshPredictions,    // ← Use shared refresh function
    error                  // ← Use shared error state
  } = usePredictions();    // ← GET FROM CONTEXT
  
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date state - ONLY TOMORROW (but now using context data)
  const [selectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });

  // Filter predictions
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPredictions(predictions); // ← Use predictions from context
    } else {
      const filtered = predictions.filter(p => 
        p.barangayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barangayId?.toString().includes(searchQuery)
      );
      setFilteredPredictions(filtered);
    }
  }, [searchQuery, predictions]); // ← Depend on context predictions

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return '#ff3b30';
      case 'moderate': return '#ff9500';
      case 'safe': return '#34c759';
      default: return '#8e8e93';
    }
  };

  const getRiskBackgroundColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return '#ffebee';
      case 'moderate': return '#fff3e0';
      case 'safe': return '#e8f5e9';
      default: return '#f5f5f5';
    }
  };

  const getVolumeRiskColor = (volumeRisk) => {
    if (!volumeRisk) return '#8e8e93';
    switch (volumeRisk.volume_risk) {
      case 'High Volume': return '#ff3b30';
      case 'Moderate Volume': return '#ff9500';
      case 'Normal Volume': return '#34c759';
      default: return '#8e8e93';
    }
  };

  const formatVolume = (volume) => {
    if (!volume) return '0 kg';
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)} tons`;
    }
    return `${Math.round(volume)} kg`;
  };

  const renderPredictionCard = ({ item }) => {
    const riskColor = getRiskColor(item.overflowRisk);
    const backgroundColor = getRiskBackgroundColor(item.overflowRisk);
    
    const volumeRisk = item.volumeRisk;
    const volumeRiskColor = getVolumeRiskColor(volumeRisk);
    
    return (
      <View style={[styles.cardContainer, { backgroundColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.barangayName}>{item.barangayName || 'Unknown Barangay'}</Text>
            <Text style={styles.barangayId}>ID: {item.barangayId || 'N/A'}</Text>
          </View>
          
          <View style={styles.riskBadgesContainer}>
            {/* Overflow Risk Badge */}
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskText}>
                {item.overflowRisk?.toUpperCase() || 'MODERATE'}
              </Text>
              <Text style={styles.riskLabel}>Overflow Risk</Text>
            </View>
            
            {/* Volume Risk Badge */}
            {volumeRisk && (
              <View style={[styles.volumeRiskBadge, { backgroundColor: volumeRiskColor }]}>
                <Text style={styles.volumeRiskText}>
                  {volumeRisk.volume_risk?.split(' ')[0]?.toUpperCase() || 'NORMAL'}
                </Text>
                <Text style={styles.volumeRiskLabel}>Volume</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.volumeContainer}>
            <Text style={styles.volumeLabel}>Forecasted Waste</Text>
            <Text style={styles.volumeValue}>
              {formatVolume(item.predictedVolume)}
            </Text>
            
            {/* Volume Risk Action */}
            {volumeRisk && (
              <Text style={[styles.volumeRiskAction, { color: volumeRiskColor }]}>
                {volumeRisk.action}
              </Text>
            )}
          </View>

          {/* Forecast Date */}
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Forecast for:</Text>
            <Text style={styles.dateValue}>
              Tomorrow ({item.date || formatDate(selectedDate)})
            </Text>
          </View>

          {/* Events Section */}
          {item.events && item.events.length > 0 && (
            <View style={styles.eventsContainer}>
              <Text style={styles.eventsLabel}>Events:</Text>
              <View style={styles.eventsList}>
                {item.events.map((event, index) => (
                  <View key={index} style={styles.eventChip}>
                    <Text style={styles.eventText}>{event}</Text>
                  </View>
                ))}
              </View>
              {item.eventMultiplier && item.eventMultiplier > 1 && (
                <Text style={styles.multiplierText}>
                  ×{item.eventMultiplier.toFixed(1)} impact
                </Text>
              )}
            </View>
          )}

          {/* Volume Risk Info */}
          {volumeRisk && (
            <View style={styles.volumeRiskInfo}>
              <Text style={styles.volumeRiskInfoText}>
                {volumeRisk.volume_risk}: {volumeRisk.threshold || 'Based on historical percentiles'}
              </Text>
            </View>
          )}

          {/* Timestamp */}
          <Text style={styles.timestamp}>
            Updated: {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading forecast for tomorrow...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshPredictions}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayPredictions = searchQuery ? filteredPredictions : predictions;

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Waste Forecast</Text>
        
        {/* Date selector */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Forecast Date:</Text>
          <Text style={styles.selectedDate}>Tomorrow • {formatDate(selectedDate)}</Text>
        </View>

        <Text style={styles.subtitle}>
          Cagayan de Oro - {predictions.length} Barangays
        </Text>
        
        {/* Volume Risk Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ff3b30' }]} />
            <Text style={styles.legendText}>High Volume ({'>'}13,128kg)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ff9500' }]} />
            <Text style={styles.legendText}>Moderate Volume (3,246-13,128kg)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#34c759' }]} />
            <Text style={styles.legendText}>Normal Volume ({'<'}3,246kg)</Text>
          </View>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search barangay by name or ID..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SEARCH RESULTS INFO */}
      {searchQuery && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            Found {filteredPredictions.length} of {predictions.length} barangays
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearAllText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PREDICTIONS LIST */}
      {displayPredictions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchQuery ? `No barangays found matching "${searchQuery}"` : 'No predictions available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayPredictions}
          keyExtractor={(item) => item.barangayId || Math.random().toString()}
          scrollEnabled={false}
          renderItem={renderPredictionCard}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Forecast for tomorrow ({formatDate(selectedDate)})
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshPredictions}>
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  dateSection: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  // NEW: Volume Risk Legend
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1c1c1e',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 18,
    color: '#999',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  clearAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Card Styles - UPDATED
  cardContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  barangayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  barangayId: {
    fontSize: 14,
    color: '#8e8e93',
  },
  // NEW: Risk badges container
  riskBadgesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 70,
  },
  volumeRiskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  riskText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  riskLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 9,
  },
  volumeRiskText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  volumeRiskLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 8,
  },
  cardContent: {
    marginTop: 4,
  },
  volumeContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  volumeLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  // NEW: Volume risk action
  volumeRiskAction: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Date in card
  dateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  eventsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  eventsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  eventChip: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  eventText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  multiplierText: {
    fontSize: 11,
    color: '#ff3b30',
    fontWeight: '600',
  },
  // NEW: Volume risk info
  volumeRiskInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  volumeRiskInfoText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'right',
    marginTop: 4,
  },
});