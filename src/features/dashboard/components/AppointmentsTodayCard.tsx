import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/data/StatusBadge';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { ROUTES } from '@/config/routes';

interface AppointmentRow {
  id: string;
  appointment_no: string;
  date: string;
  time: string;
  status: string;
  patient_name: string;
  doctor_name: string;
}

export interface AppointmentsTodayCardProps {
  doctorId?: string;
}

type RawApptRow = Record<string, unknown>;

function formatTime(time: string): string {
  // time is HH:mm or HH:mm:ss
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function AppointmentsTodayCard({ doctorId }: AppointmentsTodayCardProps) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading } = useSupabaseQuery<RawApptRow>(
    async () => {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          appointment_no,
          date,
          time,
          status,
          patients ( name ),
          doctors ( name )
        `)
        .eq('date', today)
        .order('time', { ascending: true });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      return query;
    },
    [today, doctorId]
  );

  // Flatten nested patient/doctor names
  const mapped: AppointmentRow[] = data.map((row) => {
    const patients = row.patients as { name: string } | null;
    const doctors = row.doctors as { name: string } | null;
    return {
      id: row.id as string,
      appointment_no: row.appointment_no as string,
      date: row.date as string,
      time: row.time as string,
      status: row.status as string,
      patient_name: patients?.name ?? 'Unknown',
      doctor_name: doctors?.name ?? 'Unknown',
    };
  });

  const handleClick = (id: string) => {
    navigate(ROUTES.CONSULTATION.replace(':id', id));
  };

  return (
    <Card title="Today's Appointments">
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner size="md" className="text-blue-500" />
        </div>
      ) : mapped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Calendar className="h-8 w-8 mb-2" />
          <p className="text-sm">No appointments scheduled for today</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-slate-700 -mx-6 -mb-6">
          {mapped.map((appt) => (
            <li
              key={appt.id}
              onClick={() => handleClick(appt.id)}
              className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
            >
              {/* Time pill */}
              <div className="w-16 shrink-0 text-center">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                  {formatTime(appt.time)}
                </span>
              </div>

              {/* Patient + Doctor */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {appt.patient_name}
                </p>
                <p className="text-xs text-gray-400 truncate">Dr. {appt.doctor_name}</p>
              </div>

              {/* Status badge */}
              <StatusBadge status={appt.status} type="appointment" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
