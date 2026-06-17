
import { Controller, type Control } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Activity, Heart, Thermometer, Weight, Ruler, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsultationFormData } from '../schemas/prescription.schema';
import type { Vitals } from '@/types';

interface PatientVitalsEditProps {
  mode: 'edit';
  control: Control<ConsultationFormData>;
}

interface PatientVitalsViewProps {
  mode: 'view';
  vitals: Vitals;
}

type PatientVitalsProps = PatientVitalsEditProps | PatientVitalsViewProps;

const VITAL_CONFIG = [
  { key: 'bp', label: 'BP', unit: 'mmHg', placeholder: '120/80', icon: Activity },
  { key: 'pulse', label: 'Pulse', unit: 'bpm', placeholder: '72', icon: Heart },
  { key: 'temperature', label: 'Temp', unit: '°F', placeholder: '98.6', icon: Thermometer },
  { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '70', icon: Weight },
  { key: 'height', label: 'Height', unit: 'cm', placeholder: '170', icon: Ruler },
  { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98', icon: Wind },
] as const;

function VitalCard({ label, value, unit, icon: Icon }: {
  label: string;
  value: string;
  unit: string;
  icon: typeof Activity;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide">
          {label}
        </p>
        <p className={cn(
          'text-sm font-semibold',
          value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
        )}>
          {value || '--'} <span className="text-xs font-normal text-gray-500">{value ? unit : ''}</span>
        </p>
      </div>
    </div>
  );
}

export function PatientVitals(props: PatientVitalsProps) {
  if (props.mode === 'view') {
    const { vitals } = props;
    const vitalMap: Record<string, string> = {
      bp: vitals.bp,
      pulse: vitals.pulse,
      temperature: vitals.temp,
      weight: vitals.weight,
      height: vitals.height,
      spo2: vitals.spo2,
    };

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {VITAL_CONFIG.map((v) => (
          <VitalCard
            key={v.key}
            label={v.label}
            value={vitalMap[v.key] ?? ''}
            unit={v.unit}
            icon={v.icon}
          />
        ))}
      </div>
    );
  }

  const { control } = props;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {VITAL_CONFIG.map((v) => (
        <Controller
          key={v.key}
          control={control}
          name={`vitals.${v.key}` as `vitals.${typeof v.key}`}
          render={({ field }) => (
            <Input
              label={`${v.label} (${v.unit})`}
              placeholder={v.placeholder}
              {...field}
              value={field.value ?? ''}
            />
          )}
        />
      ))}
    </div>
  );
}
