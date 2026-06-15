import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CoverageData {
  [key: string]: {
    statementMap: Record<string, any>;
    fnMap: Record<string, any>;
    branchMap: Record<string, any>;
    s: Record<string, number>;
    f: Record<string, number>;
    b: Record<string, number[]>;
    _coverageSchema: string;
    hash: string;
  };
}

interface FileCoverage {
  file: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

function calculateCoverage(data: any): FileCoverage {
  const statements = Object.values(data.s || {}).length;
  const executedStatements = Object.values(data.s || {}).filter((v: any) => v > 0).length;
  const branches = Object.values(data.b || {}).flat().length;
  const executedBranches = Object.values(data.b || {})
    .flat()
    .filter((v: any) => v > 0).length;
  const functions = Object.values(data.f || {}).length;
  const executedFunctions = Object.values(data.f || {}).filter((v: any) => v > 0).length;
  const lines = Object.keys(data.statementMap || {}).length;
  const executedLines = Object.values(data.s || {}).filter((v: any) => v > 0).length;

  return {
    file: 'coverage',
    statements: statements > 0 ? Math.round((executedStatements / statements) * 100) : 0,
    branches: branches > 0 ? Math.round((executedBranches / branches) * 100) : 0,
    functions: functions > 0 ? Math.round((executedFunctions / functions) * 100) : 0,
    lines: lines > 0 ? Math.round((executedLines / lines) * 100) : 0,
  };
}

function generateCoverageSummary(): string {
  try {
    const coveragePath = join(process.cwd(), 'coverage', 'coverage-final.json');
    const coverageData: CoverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));

    // Calculate overall coverage
    let totalStatements = 0;
    let executedStatements = 0;
    let totalBranches = 0;
    let executedBranches = 0;
    let totalFunctions = 0;
    let executedFunctions = 0;
    let totalLines = 0;
    let executedLines = 0;

    const fileStats: { [key: string]: FileCoverage } = {};

    // Process each file
    Object.entries(coverageData).forEach(([filePath, data]) => {
      const fileName = filePath.replace(/\\/g, '/').split('/').pop() || filePath;

      // Statements
      const statements = Object.keys(data.s || {}).length;
      const executedStmt = Object.values(data.s || {}).filter(v => v > 0).length;
      const stmtCov = statements > 0 ? Math.round((executedStmt / statements) * 100) : 0;

      // Branches
      const branches = Object.values(data.b || {})
        .flat()
        .filter((v: any) => v !== undefined).length;
      const executedBr = Object.values(data.b || {})
        .flat()
        .filter((v: any) => v > 0).length;
      const branchCov = branches > 0 ? Math.round((executedBr / branches) * 100) : 0;

      // Functions
      const functions = Object.keys(data.f || {}).length;
      const executedFunc = Object.values(data.f || {}).filter(v => v > 0).length;
      const funcCov = functions > 0 ? Math.round((executedFunc / functions) * 100) : 0;

      // Lines
      const lines = Object.keys(data.statementMap || {}).length;
      const executedLn = Object.values(data.s || {}).filter(v => v > 0).length;
      const lineCov = lines > 0 ? Math.round((executedLn / lines) * 100) : 0;

      fileStats[fileName] = {
        file: fileName,
        statements: stmtCov,
        branches: branchCov,
        functions: funcCov,
        lines: lineCov,
      };

      // Aggregate totals
      totalStatements += statements;
      executedStatements += executedStmt;
      totalBranches += branches;
      executedBranches += executedBr;
      totalFunctions += functions;
      executedFunctions += executedFunc;
      totalLines += lines;
      executedLines += executedLn;
    });

    // Calculate overall percentages
    const overallStatements =
      totalStatements > 0 ? Math.round((executedStatements / totalStatements) * 100) : 0;
    const overallBranches =
      totalBranches > 0 ? Math.round((executedBranches / totalBranches) * 100) : 0;
    const overallFunctions =
      totalFunctions > 0 ? Math.round((executedFunctions / totalFunctions) * 100) : 0;
    const overallLines = totalLines > 0 ? Math.round((executedLines / totalLines) * 100) : 0;

    // Generate markdown
    let summary = '\n## 📊 Code Coverage Report\n\n';
    summary += `### Overall Coverage: ${overallStatements}% | Branches: ${overallBranches}% | Functions: ${overallFunctions}% | Lines: ${overallLines}%\n\n`;

    // Sort files by name
    const sortedFiles = Object.values(fileStats).sort((a, b) => a.file.localeCompare(b.file));

    summary += '| File | Statements | Branches | Functions | Lines |\n';
    summary += '|------|-----------|----------|-----------|-------|\n';

    sortedFiles.forEach(stat => {
      const stmtIcon = stat.statements === 100 ? '✅' : stat.statements >= 80 ? '⚠️' : '❌';
      const branchIcon = stat.branches === 100 ? '✅' : stat.branches >= 80 ? '⚠️' : '❌';
      const funcIcon = stat.functions === 100 ? '✅' : stat.functions >= 80 ? '⚠️' : '❌';
      const lineIcon = stat.lines === 100 ? '✅' : stat.lines >= 80 ? '⚠️' : '❌';

      summary += `| ${stat.file} | ${stmtIcon} ${stat.statements}% | ${branchIcon} ${stat.branches}% | ${funcIcon} ${stat.functions}% | ${lineIcon} ${stat.lines}% |\n`;
    });

    summary += '\n**Legend:** ✅ = 100% | ⚠️ = 80%+ | ❌ = <80%\n';
    summary += '\nFull coverage report: [View HTML Report](./coverage/index.html)\n';

    return summary;
  } catch (error) {
    console.error('Error generating coverage summary:', error);
    return '';
  }
}

// Generate and output summary
const summary = generateCoverageSummary();
console.log(summary);

// Also save to a file for use in workflows
const summaryPath = join(process.cwd(), 'coverage-summary.md');
writeFileSync(summaryPath, summary, 'utf-8');
console.log(`\nCoverage summary saved to: ${summaryPath}`);
