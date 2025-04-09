import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TodayIcon from '@mui/icons-material/Today';

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
  onCurrentDateClick?: () => void;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  month,
  year,
  transactions,
  totalIncome,
  totalExpenses,
  balance,
  onDeleteTransaction,
  onCurrentDateClick
}) => {
  const [filters, setFilters] = useState({
    date: null as Date | null,
    description: '',
    type: 'all',
    minAmount: '',
    maxAmount: '',
    isRecurring: 'all'
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      // Date filter
      if (filters.date && !isSameDay(transactionDate, filters.date)) {
        return false;
      }

      // Description filter
      if (filters.description && !transaction.description.toLowerCase().includes(filters.description.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && transaction.type !== Number(filters.type)) {
        return false;
      }

      // Amount filter
      const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : null;
      const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : null;
      
      if (minAmount !== null && transaction.amount < minAmount) {
        return false;
      }
      if (maxAmount !== null && transaction.amount > maxAmount) {
        return false;
      }

      // Recurring filter
      if (filters.isRecurring !== 'all' && transaction.isRecurring !== (filters.isRecurring === 'true')) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">
          Relatório Mensal - {new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })} {year}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<TodayIcon />}
          onClick={onCurrentDateClick}
          size="small"
        >
          Data Atual
        </Button>
      </Box>

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

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Filtrar por Data"
            value={filters.date}
            onChange={(newDate) => setFilters(prev => ({ ...prev, date: newDate }))}
            format="dd/MM/yyyy"
            slotProps={{
              textField: { size: 'small' }
            }}
          />
        </LocalizationProvider>

        <TextField
          label="Filtrar Descrição"
          value={filters.description}
          onChange={(e) => setFilters(prev => ({ ...prev, description: e.target.value }))}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={filters.type}
            label="Tipo"
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value={TransactionType.Income}>Receita</MenuItem>
            <MenuItem value={TransactionType.Expense}>Despesa</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Valor Mínimo"
          value={filters.minAmount}
          onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
          type="number"
          size="small"
          inputProps={{ min: 0, step: "0.01" }}
        />

        <TextField
          label="Valor Máximo"
          value={filters.maxAmount}
          onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
          type="number"
          size="small"
          inputProps={{ min: 0, step: "0.01" }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Recorrente</InputLabel>
          <Select
            value={filters.isRecurring}
            label="Recorrente"
            onChange={(e) => setFilters(prev => ({ ...prev, isRecurring: e.target.value }))}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="true">Sim</MenuItem>
            <MenuItem value="false">Não</MenuItem>
          </Select>
        </FormControl>
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
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
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