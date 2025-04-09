import React, { useState } from 'react';
import { TextField, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Box, FormHelperText } from '@mui/material';
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

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit }) => {
  const [transaction, setTransaction] = useState({
    description: '',
    amount: '',
    date: new Date(),
    type: 'Expense',
    isRecurring: false,
    recurringPeriod: 'Monthly'
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
      amount: parseFloat(transaction.amount)
    };

    onSubmit(sanitizedTransaction);

    setTransaction({
      description: '',
      amount: '',
      date: new Date(),
      type: 'Expense',
      isRecurring: false,
      recurringPeriod: 'Monthly'
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
          onChange={(e) => setTransaction({ ...transaction, type: e.target.value })}
          label="Type"
        >
          <MenuItem value="Expense">Expense</MenuItem>
          <MenuItem value="Income">Income</MenuItem>
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
            onChange={(e) => setTransaction({ ...transaction, recurringPeriod: e.target.value })}
            label="Recurring Period"
          >
            <MenuItem value="Monthly">Monthly</MenuItem>
            <MenuItem value="Quarterly">Quarterly</MenuItem>
            <MenuItem value="Yearly">Yearly</MenuItem>
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