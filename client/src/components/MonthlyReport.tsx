import React from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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
  onDeleteTransaction: (id: number) => void;
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
  balance,
  onDeleteTransaction
}) => {
  const sanitizeDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const sanitizeText = (text: string): string => {
    return text.replace(/<[^>]*>/g, '').trim();
  };

  const sanitizeAmount = (amount: number): string => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Relatório Mensal - {new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })} {year}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, bgcolor: 'success.light', color: 'white' }}>
          <Typography variant="subtitle2">Receita Total</Typography>
          <Typography variant="h6">{sanitizeAmount(totalIncome)}</Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, bgcolor: 'error.light', color: 'white' }}>
          <Typography variant="subtitle2">Despesa Total</Typography>
          <Typography variant="h6">{sanitizeAmount(totalExpenses)}</Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, bgcolor: balance >= 0 ? 'primary.light' : 'warning.light', color: 'white' }}>
          <Typography variant="subtitle2">Saldo</Typography>
          <Typography variant="h6">{sanitizeAmount(balance)}</Typography>
        </Paper>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Recorrente</TableCell>
              <TableCell>Ações</TableCell>
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
                  <TableCell>{transaction.type === TransactionType.Income ? 'Receita' : 'Despesa'}</TableCell>
                  <TableCell align="right" sx={{ color: transaction.type === TransactionType.Income ? 'success.main' : 'error.main' }}>
                    {sanitizeAmount(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? `Sim (${transaction.recurringPeriod === RecurringPeriod.Monthly ? 'Mensal' : 
                      transaction.recurringPeriod === RecurringPeriod.Quarterly ? 'Trimestral' : 'Anual'})` : 'Não'}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => onDeleteTransaction(transaction.id)}
                      color="error"
                      size="small"
                      title="Excluir transação"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};