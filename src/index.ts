import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import type { YNABTransaction, CSVRow, YNABTransactionResponse, YNABErrorResponse } from './types.js';

dotenv.config();

const YNAB_API_BASE = 'https://api.ynab.com/v1';
const ACCESS_TOKEN = process.env.YNAB_ACCESS_TOKEN;
const BUDGET_ID = process.env.YNAB_BUDGET_ID || 'last-used';
const ACCOUNT_ID = process.env.YNAB_ACCOUNT_ID;

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

/**
 * Convert dollar amount to milliunits (YNAB uses milliunits: $1.00 = 1000)
 * @param amount - Dollar amount
 * @returns Amount in milliunits
 */
function convertToMilliunits(amount: string | number): number {
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[$,]/g, '')) : amount;
  return -Math.round(numAmount * 1000);
}

/**
 * Format date to DD/MM/YYYY format
 * @param dateString - Date in various formats
 * @returns Date in YYYY-MM-DD format
 */
function formatDate(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Read transactions from CSV file
 * @param filePath - Path to CSV file
 * @returns Array of transaction objects
 */
async function readTransactionsFromCSV(filePath: string): Promise<YNABTransaction[]> {
  return new Promise((resolve, reject) => {
    const transactions: YNABTransaction[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        // Map CSV columns to YNAB transaction format
        // Adjust column names to match your CSV file
        const transaction: YNABTransaction = {
          account_id: ACCOUNT_ID!,
          date: formatDate(row.date || row.Date || ''),
          amount: convertToMilliunits(row.amount || row.Amount || '0'),
          memo: row.memo || row.Memo || row.description || row.Description || '',
          cleared: 'uncleared',
          approved: false
        };

        // Add payee if provided
        if (row.payee || row.Payee) {
          transaction.payee_name = row.payee || row.Payee;
        }

        transactions.push(transaction);
      })
      .on('end', () => {
        resolve(transactions);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

/**
 * Create transactions in YNAB
 * @param transactions - Array of transaction objects
 * @returns API response
 */
async function createTransactions(transactions: YNABTransaction[]): Promise<YNABTransactionResponse> {
  const url = `${YNAB_API_BASE}/budgets/${BUDGET_ID}/transactions`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ transactions })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`YNAB API Error: ${JSON.stringify(errorData)}`);
  }

  return response.json() as Promise<YNABTransactionResponse>;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Validate environment variables
    if (!ACCESS_TOKEN) {
      console.error('Error: YNAB_ACCESS_TOKEN not found in .env file');
      console.log('Please create a .env file based on .env.example and add your access token');
      process.exit(1);
    }

    if (!ACCOUNT_ID) {
      console.error('Error: YNAB_ACCOUNT_ID not found in .env file');
      console.log('Please add your account ID to the .env file');
      process.exit(1);
    }

    // Get CSV file path from command line argument
    const csvFilePath = process.argv.find(arg => arg.endsWith('.csv'));
    
    if (!csvFilePath) {
      console.error('Error: No CSV file specified');
      console.log('Usage: npm start <path-to-csv-file>');
      console.log('Example: npm start transactions.csv');
      process.exit(1);
    }

    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: File not found: ${csvFilePath}`);
      process.exit(1);
    }

    console.log(`Reading transactions from: ${csvFilePath}`);
    const transactions = await readTransactionsFromCSV(csvFilePath);
    
    console.log(`\nFound ${transactions.length} transactions:`);
    transactions.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.date} - $${(t.amount / 1000).toFixed(2)} - ${t.memo || '(no memo)'} - Payee: ${t.payee_name || '(no payee)'}`);
    });

    if (isDryRun) {
      console.log('\n✓ Dry run mode - no transactions were sent to YNAB');
      return;
    }

    console.log('\nSending transactions to YNAB...');
    const result = await createTransactions(transactions);
    
    console.log(`\n✓ Successfully created ${result.data.transaction_ids?.length || transactions.length} transactions!`);
    console.log('Check your YNAB budget to see the imported transactions.');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
