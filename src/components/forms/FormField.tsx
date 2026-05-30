// #must: Wrapper connecting react-hook-form Controller to Input/Select/Textarea components
import { Controller, type Control, type FieldValues, type Path, type RegisterOptions } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export interface FormFieldProps<T extends FieldValues> {
  /** react-hook-form control object */
  control: Control<T>;
  /** Field name (must match form schema) */
  name: Path<T>;
  /** Label text */
  label?: string;
  /** Input type */
  type?: 'text' | 'email' | 'number' | 'password' | 'select' | 'textarea';
  /** Options for select type */
  options?: SelectOption[];
  /** Validation rules */
  rules?: RegisterOptions<T>;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text below input */
  helperText?: string;
  /** Whether field is disabled */
  disabled?: boolean;
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  options = [],
  rules,
  placeholder,
  helperText,
  disabled,
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const errorMessage = error?.message;

        if (type === 'select') {
          return (
            <Select
              label={label}
              error={errorMessage}
              options={options}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          );
        }

        if (type === 'textarea') {
          return (
            <Textarea
              label={label}
              error={errorMessage}
              helperText={helperText}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
            />
          );
        }

        return (
          <Input
            label={label}
            type={type}
            error={errorMessage}
            helperText={helperText}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
          />
        );
      }}
    />
  );
}
