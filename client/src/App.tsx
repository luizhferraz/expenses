import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Alert, Snackbar } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TransactionForm } from './components/TransactionForm';
import { MonthlyReport } from './components/MonthlyReport';
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
            Something went wrong. Please refresh the page and try again.
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({
    transactions: [],
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  });
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyReport = async () => {
    try {
      const response = await api.get('/transactions/monthly-report', {
        params: {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1
        }
      });
      setMonthlyData(response.data);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching data';
      setError(errorMessage);
      console.error('Error fetching monthly report:', error);
    }
  };

  const handleAddTransaction = async (transaction: any) => {
    try {
      await api.post('/transactions', transaction);
      fetchMonthlyReport();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while adding transaction';
      setError(errorMessage);
      console.error('Error adding transaction:', error);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [currentDate]);

  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="md">
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Family Expense Tracker
            </Typography>
            
            <TransactionForm onSubmit={handleAddTransaction} />
            
            <MonthlyReport
              month={currentDate.getMonth() + 1}
              year={currentDate.getFullYear()}
              transactions={monthlyData.transactions}
              totalIncome={monthlyData.totalIncome}
              totalExpenses={monthlyData.totalExpenses}
              balance={monthlyData.balance}
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
