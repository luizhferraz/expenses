import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Alert, Snackbar } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { TransactionForm } from './components/TransactionForm';
import { MonthlyReport } from './components/MonthlyReport';
import axios from 'axios';
import { startOfMonth, format } from 'date-fns';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5202/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Algo deu errado. Por favor, atualize a página e tente novamente.
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()));
  const [monthlyDataMap, setMonthlyDataMap] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCurrentDateClick = () => {
    setSelectedDate(startOfMonth(new Date()));
  };

  const fetchMonthlyReport = async (date: Date) => {
    const key = format(date, 'yyyy-MM');
    setIsLoading(true);
    try {
      const response = await api.get('/transactions/monthly-report', {
        params: {
          year: date.getFullYear(),
          month: date.getMonth() + 1
        }
      });
      setMonthlyDataMap(prev => ({
        ...prev,
        [key]: response.data
      }));
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao buscar os dados';
      setError(errorMessage);
      console.error('Error fetching monthly report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (transaction: any) => {
    setIsLoading(true);
    try {
      const response = await api.post('/transactions', transaction);
      console.log('Transaction created:', response.data);
      // Clear the cached data for the current month to force a fresh fetch
      const key = format(selectedDate, 'yyyy-MM');
      setMonthlyDataMap(prev => {
        const newMap = { ...prev };
        delete newMap[key];
        return newMap;
      });
      // Refetch the current month's data
      await fetchMonthlyReport(selectedDate);
      setError(null);
    } catch (error) {
      console.error('Full error object:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar a transação';
      setError(errorMessage);
      console.error('Error adding transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    setIsLoading(true);
    try {
      console.log('Attempting to delete transaction with ID:', id);
      await api.delete(`/transactions/${id}`);
      console.log('Successfully deleted transaction with ID:', id);
      // Clear the cached data for the current month to force a fresh fetch
      const key = format(selectedDate, 'yyyy-MM');
      setMonthlyDataMap(prev => {
        const newMap = { ...prev };
        delete newMap[key];
        return newMap;
      });
      // Refetch the current month's data
      await fetchMonthlyReport(selectedDate);
      setError(null);
    } catch (error) {
      console.error('Full error object:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao excluir a transação';
      setError(errorMessage);
      console.error('Error deleting transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport(selectedDate);
  }, [selectedDate]);

  const currentMonthKey = format(selectedDate, 'yyyy-MM');
  const currentMonthData = monthlyDataMap[currentMonthKey] || {
    transactions: [],
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  };

  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <Container maxWidth="md">
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Controle de Despesas Familiar
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <DatePicker
                views={['month', 'year']}
                value={selectedDate}
                onChange={(newDate) => newDate && setSelectedDate(startOfMonth(newDate))}
                format="MMMM yyyy"
                label="Selecionar Mês"
              />
            </Box>

            <TransactionForm onSubmit={handleAddTransaction} />
            
            <MonthlyReport
              month={selectedDate.getMonth() + 1}
              year={selectedDate.getFullYear()}
              transactions={currentMonthData.transactions}
              totalIncome={currentMonthData.totalIncome}
              totalExpenses={currentMonthData.totalExpenses}
              balance={currentMonthData.balance}
              onDeleteTransaction={handleDeleteTransaction}
              onCurrentDateClick={handleCurrentDateClick}
            />

            <Snackbar 
              open={!!error} 
              autoHideDuration={6000} 
              onClose={() => setError(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            </Snackbar>
          </Box>
        </Container>
      </LocalizationProvider>
    </ErrorBoundary>
  );
}

export default App;
