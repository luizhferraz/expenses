import React, { useState } from 'react';
import { TextField, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface TransactionFormProps {
  onSubmit: (transaction: any) => void;
}

interface ValidationErrors {
  description?: string;
  amount?: string;
  date?: string;
}

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

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit }) => {
  const [transaction, setTransaction] = useState({
    description: '',
    amount: '',
    date: new Date(),
    type: TransactionType.Expense,
    isRecurring: false,
    recurringPeriod: RecurringPeriod.Monthly
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.length < 3) return 'Description must be at least 3 characters';
        if (value.length > 200) return 'Description must be less than 200 characters';
        return '';
      case 'amount':
        if (!value) return 'Amount is required';
        if (isNaN(value) || parseFloat(value) <= 0) return 'Amount must be greater than 0';
        return '';
      case 'date':
        if (!value) return 'Date is required';
        if (!(value instanceof Date) || isNaN(value.getTime())) return 'Invalid date';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setTransaction(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const sanitizeInput = (input: string): string => {
    return input.replace(/<[^>]*>/g, '').trim();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: ValidationErrors = {
      description: validateField('description', transaction.description),
      amount: validateField('amount', transaction.amount),
      date: validateField('date', transaction.date)
    };

    setErrors(newErrors);
    setTouched({
      description: true,
      amount: true,
      date: true
    });

    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    const sanitizedTransaction = {
      ...transaction,
      description: sanitizeInput(transaction.description),
      amount: Number(transaction.amount).toFixed(2), // Format as decimal
      date: transaction.date.toISOString(), // Format date as ISO string
      type: Number(transaction.type), // Ensure type is sent as a number
      recurringPeriod: transaction.isRecurring ? Number(transaction.recurringPeriod) : null // Send null if not recurring
    };

    onSubmit(sanitizedTransaction);

    setTransaction({
      description: '',
      amount: '',
      date: new Date(),
      type: TransactionType.Expense,
      isRecurring: false,
      recurringPeriod: RecurringPeriod.Monthly
    });
    setErrors({});
    setTouched({});
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        margin="normal"
        label="Description"
        value={transaction.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
        error={touched.description && !!errors.description}
        helperText={touched.description && errors.description}
        required
        inputProps={{ maxLength: 200 }}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Amount"
        type="number"
        value={transaction.amount}
        onChange={(e) => handleInputChange('amount', e.target.value)}
        onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
        error={touched.amount && !!errors.amount}
        helperText={touched.amount && errors.amount}
        required
        inputProps={{ min: 0.01, step: 0.01 }}
      />
      <Box sx={{ my: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date"
            value={transaction.date}
            onChange={(newDate) => handleInputChange('date', newDate)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: touched.date && !!errors.date,
                helperText: touched.date && errors.date
              }
            }}
          />
        </LocalizationProvider>
      </Box>
      <FormControl fullWidth margin="normal">
        <InputLabel>Type</InputLabel>
        <Select
          value={transaction.type}
          onChange={(e) => setTransaction({ ...transaction, type: Number(e.target.value) })}
          label="Type"
        >
          <MenuItem value={TransactionType.Expense}>Expense</MenuItem>
          <MenuItem value={TransactionType.Income}>Income</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={transaction.isRecurring}
            onChange={(e) => setTransaction({ ...transaction, isRecurring: e.target.checked })}
          />
        }
        label="Is Recurring"
      />
      {transaction.isRecurring && (
        <FormControl fullWidth margin="normal">
          <InputLabel>Recurring Period</InputLabel>
          <Select
            value={transaction.recurringPeriod}
            onChange={(e) => setTransaction({ ...transaction, recurringPeriod: Number(e.target.value) })}
            label="Recurring Period"
          >
            <MenuItem value={RecurringPeriod.Monthly}>Monthly</MenuItem>
            <MenuItem value={RecurringPeriod.Quarterly}>Quarterly</MenuItem>
            <MenuItem value={RecurringPeriod.Yearly}>Yearly</MenuItem>
          </Select>
        </FormControl>
      )}
      <Button
        variant="contained"
        color="primary"
        type="submit"
        style={{ marginTop: 16 }}
        disabled={Object.values(errors).some(error => error)}
      >
        Add Transaction
      </Button>
    </form>
  );
};