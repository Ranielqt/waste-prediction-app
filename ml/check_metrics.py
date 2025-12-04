# check_metrics.py
import json

print("="*60)
print("📊 CHECKING YOUR TRAINED MODEL METRICS")
print("="*60)

# Load your metadata
try:
    with open('ml_models_metadata.json', 'r') as f:
        metadata = json.load(f)
    print("✅ Successfully loaded ml_models_metadata.json")
    
except Exception as e:
    print(f"❌ Error loading metadata: {e}")
    print("\n📁 Files in current directory:")
    import os
    for file in os.listdir('.'):
        print(f"  - {file}")
    exit(1)

# Show ALL the metrics
print("\n" + "="*60)
print("🎯 YOUR REAL MODEL PERFORMANCE")
print("="*60)

# Model Info
print(f"\n📋 MODEL INFO:")
print(f"   Name: {metadata.get('model_info', {}).get('name', 'Unknown')}")
print(f"   Version: {metadata.get('model_info', {}).get('version', 'Unknown')}")
print(f"   Trained: {metadata.get('model_info', {}).get('trained_date', 'Unknown')}")
print(f"   Barangays: {metadata.get('model_info', {}).get('num_barangays', 'Unknown')}")

# REAL METRICS
if 'real_metrics' in metadata:
    print(f"\n📈 VOLUME PREDICTION (Regressor):")
    vol = metadata['real_metrics']['volume_regressor']
    print(f"   R² Score: {vol.get('r2_score', 0):.4f}")
    print(f"   MSE: {vol.get('mse', 0):.2f}")
    print(f"   MAE: {vol.get('mae', 0):.2f} kg")
    
    print(f"\n⚠️  RISK CLASSIFICATION (Classifier):")
    risk = metadata['real_metrics']['risk_classifier']
    print(f"   Accuracy: {risk.get('accuracy', 0):.4f} ({risk.get('accuracy', 0)*100:.1f}%)")
    
    # These are the numbers for your analytics page!
    print(f"\n🎯 METRICS FOR ANALYTICS PAGE:")
    print(f"   R² Score to show: {vol.get('r2_score', 0):.3f}")
    print(f"   MSE to show: {vol.get('mse', 0):.3f}")
    print(f"   Accuracy to show: {risk.get('accuracy', 0):.3f} ({risk.get('accuracy', 0)*100:.1f}%)")
    
elif 'regressor_performance' in metadata:
    print(f"\n📊 OLD FORMAT METRICS:")
    print(f"   R² Score: {metadata['regressor_performance'].get('r2_score', 0):.4f}")
    print(f"   Accuracy: {metadata['classifier_performance'].get('accuracy', 0):.4f}")

# Volume risk thresholds
if 'risk_thresholds' in metadata:
    print(f"\n🎯 VOLUME RISK CATEGORIES:")
    thresholds = metadata['risk_thresholds']['volume_risk_percentiles']
    print(f"   P70 (Moderate threshold): {thresholds.get('p70', 0):.0f} kg")
    print(f"   P90 (High threshold): {thresholds.get('p90', 0):.0f} kg")
    print(f"   Barangays above P90 need IMMEDIATE attention")
    print(f"   Barangays between P70-P90 need MONITORING")
    print(f"   Barangays below P70 are NORMAL")

print("\n" + "="*60)
print("✅ These are the REAL numbers for your analytics dashboard!")
print("   No more zeros - show these actual metrics!")
print("="*60)