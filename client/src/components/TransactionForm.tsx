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
  recurrenceCount?: string;
}

interface TransactionState {
  description: string;
  amount: string;
  date: Date;
  type: TransactionType;
  isRecurring: boolean;
  recurringPeriod: RecurringPeriod;
  recurrenceCount: number | null;
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
  const [transaction, setTransaction] = useState<TransactionState>({
    description: '',
    amount: '',
    date: new Date(),
    type: TransactionType.Expense,
    isRecurring: false,
    recurringPeriod: RecurringPeriod.Monthly,
    recurrenceCount: null
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'description':
        if (!value.trim()) return 'A descrição é obrigatória';
        if (value.length < 3) return 'A descrição deve ter pelo menos 3 caracteres';
        if (value.length > 200) return 'A descrição deve ter menos de 200 caracteres';
        return '';
      case 'amount':
        if (!value) return 'O valor é obrigatório';
        if (isNaN(value) || parseFloat(value) <= 0) return 'O valor deve ser maior que 0';
        return '';
      case 'date':
        if (!value) return 'A data é obrigatória';
        if (!(value instanceof Date) || isNaN(value.getTime())) return 'Data inválida';
        return '';
      case 'recurrenceCount':
        if (transaction.isRecurring) {
          if (!value) return 'O número de recorrências é obrigatório';
          if (isNaN(value) || parseInt(value) < 1) return 'O número deve ser maior que 0';
          if (parseInt(value) > 60) return 'O número máximo de recorrências é 60';
        }
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
      date: validateField('date', transaction.date),
      recurrenceCount: validateField('recurrenceCount', transaction.recurrenceCount)
    };

    setErrors(newErrors);
    setTouched({
      description: true,
      amount: true,
      date: true,
      recurrenceCount: transaction.isRecurring
    });

    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    const sanitizedTransaction = {
      ...transaction,
      description: sanitizeInput(transaction.description),
      amount: Number(transaction.amount).toFixed(2),
      date: transaction.date.toISOString(),
      type: Number(transaction.type),
      recurringPeriod: transaction.isRecurring ? Number(transaction.recurringPeriod) : null,
      recurrenceCount: transaction.isRecurring ? Number(transaction.recurrenceCount) : null
    };

    onSubmit(sanitizedTransaction);

    setTransaction({
      description: '',
      amount: '',
      date: new Date(),
      type: TransactionType.Expense,
      isRecurring: false,
      recurringPeriod: RecurringPeriod.Monthly,
      recurrenceCount: null
    });
    setErrors({});
    setTouched({});
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        margin="normal"
        label="Descrição"
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
        label="Valor"
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
            label="Data"
            value={transaction.date}
            onChange={(newDate) => handleInputChange('date', newDate)}
            format="dd/MM/yyyy"
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
        <InputLabel>Tipo</InputLabel>
        <Select
          value={transaction.type}
          onChange={(e) => setTransaction({ ...transaction, type: Number(e.target.value) })}
          label="Tipo"
        >
          <MenuItem value={TransactionType.Expense}>Despesa</MenuItem>
          <MenuItem value={TransactionType.Income}>Receita</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={transaction.isRecurring}
            onChange={(e) => {
              setTransaction({ 
                ...transaction, 
                isRecurring: e.target.checked,
                recurrenceCount: e.target.checked ? 1 : null
              });
            }}
          />
        }
        label="É recorrente"
      />
      {transaction.isRecurring && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Período de Recorrência</InputLabel>
            <Select
              value={transaction.recurringPeriod}
              onChange={(e) => setTransaction({ ...transaction, recurringPeriod: Number(e.target.value) })}
              label="Período de Recorrência"
            >
              <MenuItem value={RecurringPeriod.Monthly}>Mensal</MenuItem>
              <MenuItem value={RecurringPeriod.Quarterly}>Trimestral</MenuItem>
              <MenuItem value={RecurringPeriod.Yearly}>Anual</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Número de Recorrências"
            type="number"
            value={transaction.recurrenceCount || ''}
            onChange={(e) => handleInputChange('recurrenceCount', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, recurrenceCount: true }))}
            error={touched.recurrenceCount && !!errors.recurrenceCount}
            helperText={touched.recurrenceCount && errors.recurrenceCount}
            required
            inputProps={{ min: 1, max: 60, step: 1 }}
          />
        </>
      )}
      <Button
        variant="contained"
        color="primary"
        type="submit"
        style={{ marginTop: 16 }}
        disabled={Object.values(errors).some(error => error)}
      >
        Adicionar Transação
      </Button>
    </form>
  );
};