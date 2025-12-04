// convert-csv.js - COPY ALL THIS CODE
const fs = require('fs');
const path = require('path');

console.log('🔍 Looking for CSV file...');

// Find CSV file in ml folder
const csvFiles = fs.readdirSync('ml').filter(file => file.includes('.csv'));
if (csvFiles.length === 0) {
  console.error('❌ No CSV files found in ml/ folder');
  process.exit(1);
}

const csvFilename = csvFiles[0];
const csvPath = path.join(__dirname, 'ml', csvFilename);
console.log(`📄 Found CSV: ${csvFilename}`);

try {
  const csv = fs.readFileSync(csvPath, 'utf8');
  console.log(`✅ CSV loaded: ${csv.length} characters`);

  const rows = csv.split('\n').slice(1); // Skip header
  const barangays = rows.filter(row => row.trim()).map((row, index) => {
    const cols = row.split(',');
    
    const name = cols[0].trim();
    const population = parseInt(cols[1]) || 0;
    const totalWaste = parseFloat(cols[3]?.replace(/[",]/g, '') || 0);
    
    // Determine market days
    const hasMarket = name.includes('Barangay') || 
                      ['Carmen', 'Bulua', 'Gusa', 'Macabalan', 'Lapasan', 'Kauswagan'].includes(name);
    
    // Determine flood risk
    const highRiskBarangays = ['Carmen', 'Macasandig', 'Kauswagan', 'Gusa', 'Balulang', 
                              'Bugo', 'Cugman', 'Puerto', 'Puntod', 'Tablon'];
    const floodRisk = highRiskBarangays.includes(name) ? 'high' : 'medium';
    
    return {
      id: index + 1,
      name,
      population,
      totalWaste,
      wastePerCapita: 0.42,
      residualWaste: parseFloat(cols[4]?.replace(/[",]/g, '') || 0),
      biodegradable: parseFloat(cols[5]?.replace(/[",]/g, '') || 0),
      recyclable: parseFloat(cols[6]?.replace(/[",]/g, '') || 0),
      specialWaste: parseFloat(cols[7]?.replace(/[",]/g, '') || 0),
      collectionFrequency: cols[8]?.includes('nightly') ? 'nightly' : 'morning',
      hasMarket,
      floodRisk,
      binCapacity: totalWaste,
      populationDensity: Math.floor(population / 50)
    };
  });

  console.log(`📊 Processed ${barangays.length} barangays`);
  
  // Create TypeScript file content
  const tsContent = `// Auto-generated from CSV: ${csvFilename}
// Generated on: ${new Date().toISOString()}
export const BARANGAYS = ${JSON.stringify(barangays, null, 2)};

// Statistics:
// Total barangays: ${barangays.length}
// Total population: ${barangays.reduce((sum, b) => sum + b.population, 0).toLocaleString()}
// Total waste per day: ${barangays.reduce((sum, b) => sum + b.totalWaste, 0).toLocaleString()} kg
// Average waste per barangay: ${(barangays.reduce((sum, b) => sum + b.totalWaste, 0) / barangays.length).toFixed(2)} kg
// Highest waste: ${barangays.reduce((max, b) => b.totalWaste > max.totalWaste ? b : max).name} (${barangays.reduce((max, b) => b.totalWaste > max.totalWaste ? b : max).totalWaste.toLocaleString()} kg/day)
// Lowest waste: ${barangays.reduce((min, b) => b.totalWaste < min.totalWaste ? b : min).name} (${barangays.reduce((min, b) => b.totalWaste < min.totalWaste ? b : min).totalWaste.toLocaleString()} kg/day)
`;

  // Ensure constants folder exists
  const constantsDir = path.join(__dirname, 'app', 'constants');
  if (!fs.existsSync(constantsDir)) {
    fs.mkdirSync(constantsDir, { recursive: true });
  }
  
  // Save to app/constants/barangays.ts
  const outputPath = path.join(constantsDir, 'barangays.ts');
  fs.writeFileSync(outputPath, tsContent);
  
  console.log(`✅ SUCCESS! Created: ${outputPath}`);
  console.log(`📈 Statistics:`);
  console.log(`   - ${barangays.length} barangays`);
  console.log(`   - Total waste: ${barangays.reduce((sum, b) => sum + b.totalWaste, 0).toLocaleString()} kg/day`);
  console.log(`   - Highest: ${barangays.reduce((max, b) => b.totalWaste > max.totalWaste ? b : max).name} (${barangays.reduce((max, b) => b.totalWaste > max.totalWaste ? b : max).totalWaste.toLocaleString()} kg)`);
  console.log(`   - Lowest: ${barangays.reduce((min, b) => b.totalWaste < min.totalWaste ? b : min).name} (${barangays.reduce((min, b) => b.totalWaste < min.totalWaste ? b : min).totalWaste.toLocaleString()} kg)`);
  
} catch (error) {
  console.error('❌ Error converting CSV:', error.message);
  console.error('Full error:', error);
}