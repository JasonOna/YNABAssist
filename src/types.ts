export interface YNABTransaction {
  account_id: string;
  date: string;
  amount: number;
  memo?: string;
  payee_name?: string;
  payee_id?: string;
  category_id?: string;
  cleared?: 'cleared' | 'uncleared' | 'reconciled';
  approved?: boolean;
  flag_color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
  import_id?: string;
}

export interface CSVRow {
  date?: string;
  Date?: string;
  amount?: string;
  Amount?: string;
  memo?: string;
  Memo?: string;
  description?: string;
  Description?: string;
  payee?: string;
  Payee?: string;
  [key: string]: string | undefined;
}

export interface YNABTransactionResponse {
  data: {
    transaction_ids?: string[];
    transactions?: Array<{
      id: string;
      date: string;
      amount: number;
      memo: string | null;
      cleared: string;
      approved: boolean;
      account_id: string;
    }>;
    duplicate_import_ids?: string[];
    server_knowledge?: number;
  };
}

export interface YNABErrorResponse {
  error: {
    id: string;
    name: string;
    detail: string;
  };
}
