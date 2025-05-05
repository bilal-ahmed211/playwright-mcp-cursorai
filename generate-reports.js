// Helper script to generate enhanced reports
const { generateReports } = require('./dist/lib/reporting/ReportManager');

async function main() {
  try {
    console.log('Starting enhanced report generation...');
    await generateReports();
    console.log('Enhanced reports generated successfully');
  } catch (error) {
    console.error('Error generating reports:', error);
    process.exit(1);
  }
}

main(); 