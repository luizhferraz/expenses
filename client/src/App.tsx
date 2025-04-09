import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Alert, Snackbar, Tabs, Tab } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { TransactionForm } from './components/TransactionForm';
import { MonthlyReport } from './components/MonthlyReport';
import axios from 'axios';
import { startOfMonth, addMonths, format } from 'date-fns';

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

  // Generate array of dates for 6 months in the past and 6 months in the future
  const monthTabs = Array.from({ length: 13 }, (_, i) => addMonths(selectedDate, i - 6));

  const handleCurrentDateClick = () => {
    setSelectedDate(startOfMonth(new Date()));
  };

  const fetchMonthlyReport = async (date: Date) => {
    const key = format(date, 'yyyy-MM');
    if (monthlyDataMap[key]) return;

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
    }
  };

  const handleAddTransaction = async (transaction: any) => {
    try {
      await api.post('/transactions', transaction);
      // Refresh data for the current month
      fetchMonthlyReport(selectedDate);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar a transação';
      setError(errorMessage);
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}`);
      // Refresh data for the current month
      fetchMonthlyReport(selectedDate);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao excluir a transação';
      setError(errorMessage);
      console.error('Error deleting transaction:', error);
    }
  };

  useEffect(() => {
    fetchMonthlyReport(selectedDate);
  }, [selectedDate]);

  const currentMonthData = monthlyDataMap[format(selectedDate, 'yyyy-MM')] || {
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

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={monthTabs.findIndex(date => 
                  format(date, 'yyyy-MM') === format(selectedDate, 'yyyy-MM')
                )}
                onChange={(_, newValue) => setSelectedDate(monthTabs[newValue])}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Meses"
              >
                {monthTabs.map((date) => (
                  <Tab 
                    key={format(date, 'yyyy-MM')}
                    label={format(date, 'MMM yyyy', { locale: ptBR })}
                  />
                ))}
              </Tabs>
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
