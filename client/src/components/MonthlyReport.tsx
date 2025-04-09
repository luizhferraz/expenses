import React from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

// Add enums to match backend
enum TransactionType {
  Expense = 0,
  Income = 1
}

enum RecurringPeriod {
  Monthly = 0,
  Quarterly = 1,
  Yearly = 2
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  isRecurring: boolean;
  recurringPeriod?: RecurringPeriod;
}

interface MonthlyReportProps {
  month: number;
  year: number;
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const getTransactionTypeText = (type: TransactionType): string => {
  return TransactionType[type];
};

const getRecurringPeriodText = (period: RecurringPeriod): string => {
  return RecurringPeriod[period];
};

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  month,
  year,
  transactions,
  totalIncome,
  totalExpenses,
  balance
}) => {
  const sanitizeDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const sanitizeText = (text: string): string => {
    return text.replace(/<[^>]*>/g, '').trim();
  };

  const sanitizeAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Monthly Report - {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, bgcolor: 'success.light', color: 'white' }}>
          <Typography variant="subtitle2">Total Income</Typography>
          <Typography variant="h6">{sanitizeAmount(totalIncome)}</Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, bgcolor: 'error.light', color: 'white' }}>
          <Typography variant="subtitle2">Total Expenses</Typography>
          <Typography variant="h6">{sanitizeAmount(totalExpenses)}</Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, bgcolor: balance >= 0 ? 'primary.light' : 'warning.light', color: 'white' }}>
          <Typography variant="subtitle2">Balance</Typography>
          <Typography variant="h6">{sanitizeAmount(balance)}</Typography>
        </Paper>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Recurring</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(transactions) && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{sanitizeDate(transaction.date)}</TableCell>
                  <TableCell>{sanitizeText(transaction.description)}</TableCell>
                  <TableCell>{getTransactionTypeText(transaction.type)}</TableCell>
                  <TableCell align="right" sx={{ color: transaction.type === TransactionType.Income ? 'success.main' : 'error.main' }}>
                    {sanitizeAmount(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? `Yes (${getRecurringPeriodText(transaction.recurringPeriod!)})` : 'No'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};