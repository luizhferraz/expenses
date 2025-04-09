import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { format } from 'date-fns';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: 'Income' | 'Expense';
  isRecurring: boolean;
  recurringPeriod?: 'Monthly' | 'Quarterly' | 'Yearly';
}

interface MonthlyReportProps {
  month: number;
  year: number;
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const sanitizeAmount = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const sanitizeDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return format(date, 'MMM dd, yyyy');
  } catch {
    return 'Invalid date';
  }
};

const sanitizeText = (text: string): string => {
  return text.replace(/<[^>]*>/g, '').trim();
};

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  month,
  year,
  transactions,
  totalIncome,
  totalExpenses,
  balance
}) => {
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1));

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Monthly Report - {monthName} {year}
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
            {Array.isArray(transactions) ? (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{sanitizeDate(transaction.date)}</TableCell>
                  <TableCell>{sanitizeText(transaction.description)}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell align="right" sx={{ color: transaction.type === 'Income' ? 'success.main' : 'error.main' }}>
                    {sanitizeAmount(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? `Yes (${transaction.recurringPeriod})` : 'No'}
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