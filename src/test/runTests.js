#!/usr/bin/env node

/**
 * Test Runner for Report Generation
 * 
 * This script helps run and debug the report generation tests
 * Usage: npm test
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const testCommands = {
  all: 'vitest run',
  watch: 'vitest',
  ui: 'vitest --ui',
  coverage: 'vitest run --coverage',
  reportService: 'vitest run src/services/__tests__/reportDataService.test.js',
  reportComponent: 'vitest run src/components/reports/__tests__/IBPIReport.test.jsx',
  integration: 'vitest run src/test/integration/reportGeneration.test.js',
  verbose: 'vitest run --reporter=verbose'
}

async function runTest(command) {
  console.log(`Running: ${command}`)
  console.log('='.repeat(50))
  
  try {
    const { stdout, stderr } = await execAsync(command)
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

// Get command from arguments
const testType = process.argv[2] || 'all'
const command = testCommands[testType]

if (!command) {
  console.log('Available test commands:')
  Object.keys(testCommands).forEach(key => {
    console.log(`  npm test ${key} - ${testCommands[key]}`)
  })
  process.exit(0)
}

runTest(command)