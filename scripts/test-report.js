#!/usr/bin/env node

/**
 * Test coverage report generator
 * Generates a comprehensive test coverage report with recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateTestReport() {
  log('\n📊 Generating Test Coverage Report...', 'cyan');
  
  try {
    // Run tests with coverage
    log('\nRunning tests with coverage...', 'blue');
    execSync('npm run test:coverage', { stdio: 'inherit' });
    
    // Read coverage summary
    const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
    
    if (!fs.existsSync(coveragePath)) {
      log('\n❌ Coverage report not found. Make sure tests ran successfully.', 'red');
      return;
    }
    
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    
    // Analyze coverage
    log('\n📈 Coverage Summary:', 'magenta');
    
    const metrics = ['lines', 'statements', 'functions', 'branches'];
    const results = {};
    let totalPct = 0;
    
    metrics.forEach(metric => {
      const pct = coverage.total[metric].pct;
      results[metric] = pct;
      totalPct += pct;
      
      const color = pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red';
      const icon = pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '❌';
      
      log(`${icon} ${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${pct}%`, color);
    });
    
    const avgCoverage = (totalPct / metrics.length).toFixed(2);
    log(`\n📊 Average Coverage: ${avgCoverage}%`, avgCoverage >= 80 ? 'green' : 'yellow');
    
    // Find uncovered files
    log('\n📁 Files with Low Coverage:', 'yellow');
    
    const lowCoverageFiles = [];
    
    Object.entries(coverage).forEach(([file, data]) => {
      if (file === 'total') return;
      
      const fileCoverage = data.lines.pct;
      if (fileCoverage < 80) {
        lowCoverageFiles.push({
          file: file.replace(process.cwd(), '.'),
          coverage: fileCoverage,
          uncoveredLines: data.lines.total - data.lines.covered
        });
      }
    });
    
    lowCoverageFiles
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 10)
      .forEach(({ file, coverage, uncoveredLines }) => {
        log(`  ${file}: ${coverage}% (${uncoveredLines} uncovered lines)`, 'yellow');
      });
    
    // Generate recommendations
    log('\n💡 Recommendations:', 'cyan');
    
    const recommendations = [];
    
    if (results.branches < 80) {
      recommendations.push('- Add more tests for conditional branches and edge cases');
    }
    
    if (results.functions < 80) {
      recommendations.push('- Ensure all exported functions have at least one test');
    }
    
    if (lowCoverageFiles.length > 0) {
      recommendations.push(`- Focus on improving coverage for ${lowCoverageFiles.length} files below 80%`);
    }
    
    if (avgCoverage < 80) {
      recommendations.push('- Add integration tests for critical user flows');
      recommendations.push('- Consider using snapshot testing for UI components');
    }
    
    recommendations.forEach(rec => log(rec, 'blue'));
    
    // Check for missing test files
    log('\n🔍 Checking for missing test files...', 'cyan');
    
    const srcDir = path.join(__dirname, '../src');
    const missingTests = findMissingTests(srcDir);
    
    if (missingTests.length > 0) {
      log(`\n⚠️  Found ${missingTests.length} files without tests:`, 'yellow');
      missingTests.slice(0, 10).forEach(file => {
        log(`  ${file}`, 'yellow');
      });
      
      if (missingTests.length > 10) {
        log(`  ... and ${missingTests.length - 10} more`, 'yellow');
      }
    } else {
      log('✅ All source files have corresponding test files!', 'green');
    }
    
    // Generate HTML report
    log('\n📄 Generating detailed HTML report...', 'blue');
    
    const reportPath = path.join(__dirname, '../coverage/lcov-report/index.html');
    if (fs.existsSync(reportPath)) {
      log(`✅ HTML report generated at: ${reportPath}`, 'green');
      log('   Run "npm run test:coverage" and open the report in your browser', 'blue');
    }
    
    // Summary
    log('\n📊 Test Report Summary:', 'magenta');
    log(`- Total Coverage: ${avgCoverage}%`, avgCoverage >= 80 ? 'green' : 'yellow');
    log(`- Files with Low Coverage: ${lowCoverageFiles.length}`, lowCoverageFiles.length > 0 ? 'yellow' : 'green');
    log(`- Files Missing Tests: ${missingTests.length}`, missingTests.length > 0 ? 'yellow' : 'green');
    
    // Exit with appropriate code
    const exitCode = avgCoverage >= 80 ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
    log(`\n❌ Error generating test report: ${error.message}`, 'red');
    process.exit(1);
  }
}

function findMissingTests(dir, baseDir = dir) {
  const missingTests = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip test directories
      if (!file.includes('test') && !file.includes('__tests__')) {
        missingTests.push(...findMissingTests(filePath, baseDir));
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      // Skip test files and config files
      if (!file.includes('.test.') && !file.includes('.spec.') && !file.includes('config')) {
        // Check if test file exists
        const testFile1 = file.replace(/\.(jsx?)$/, '.test.$1');
        const testFile2 = file.replace(/\.(jsx?)$/, '.spec.$1');
        const testDir = path.join(dir, '__tests__');
        
        const hasTest = 
          fs.existsSync(path.join(dir, testFile1)) ||
          fs.existsSync(path.join(dir, testFile2)) ||
          (fs.existsSync(testDir) && (
            fs.existsSync(path.join(testDir, testFile1)) ||
            fs.existsSync(path.join(testDir, testFile2)) ||
            fs.existsSync(path.join(testDir, file))
          ));
        
        if (!hasTest) {
          missingTests.push(path.relative(baseDir, filePath));
        }
      }
    }
  });
  
  return missingTests;
}

// Run the report generator
generateTestReport();