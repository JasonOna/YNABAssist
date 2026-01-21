# YNAB CSV Importer

Automate importing transactions from CSV files into your YNAB (You Need A Budget) account using TypeScript.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Get your personal access token from [YNAB Developer Settings](https://app.ynab.com/settings/developer)
   - Add your token to the `.env` file
   - Add your budget ID (or use "last-used")
   - Add your account ID (you can get this from the YNAB API or by inspecting the URL when viewing an account)

3. **Prepare your CSV file:**
   
   Your CSV should have the following columns (column names are case-insensitive):
   - `date` - Transaction date (various formats accepted)
   - `amount` - Amount in dollars (negative for expenses, positive for income)
   - `memo` - Transaction description/notes
   - `payee` - (Optional) Payee name

   See `sample.csv` for an example.

## Usage

**Build the project:**
```bash
npm run build
```

**Import transactions:**
```bash
npm start your-transactions.csv
```

**Dry run (preview without importing):**
```bash
npm test
# or
npm start your-transactions.csv -- --dry-run
```

**Development (build and run):**
```bash
npm run dev your-transactions.csv
```

## CSV Format

The script accepts CSV files with these columns:
- `date` - Transaction date
- `amount` - Dollar amount (use negative for expenses)
- `memo` - Transaction description
- `payee` - (Optional) Payee name

Example:
```csv
date,amount,memo,payee
2026-01-15,-45.50,Groceries for the week,Whole Foods
2026-01-16,1000.00,Freelance payment received,Client ABC
```

## How It Works

1. Reads transactions from your CSV file
2. Converts amounts to milliunits (YNAB's format: $1.00 = 1000)
3. Formats dates to YYYY-MM-DD
4. Creates transactions via the YNAB API

## Notes

- Transactions are created as "uncleared" and "unapproved" by default
- You can modify these settings in the code if needed
- The script uses YNAB API v1
- All amounts must be in milliunits (multiply by 1000)
- TypeScript provides type safety for YNAB API interactions

## Getting Your Account ID

To find your account ID, you can:
1. Use the YNAB API to list accounts: `GET https://api.ynab.com/v1/budgets/{budget_id}/accounts`
2. Or inspect the URL when viewing an account in YNAB (it's the UUID in the URL)

## Troubleshooting

- **401 Unauthorized**: Check that your access token is correct
- **400 Bad Request**: Verify your CSV format and that account_id is valid
- **404 Not Found**: Check that your budget_id is correct
