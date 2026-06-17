import { Link, Navigate } from 'react-router-dom';
import { Stethoscope, FlaskConical, Pill, Calendar, Phone, Mail, MapPin, ArrowRight, Shield, Clock } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/store/authStore';

const CLINIC = {
  name: 'Mohit Pharma Pvt. Ltd.',
  phone: '8981256860',
  email: 'themadmysteryteam@gmail.com',
  address: '1/2, abc, xyz place, kolkata - 700039',
};

const SERVICES = [
  {
    icon: Calendar,
    title: 'Doctor Appointments',
    desc: 'Book consultations, manage prescriptions & follow-ups with ease.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Pill,
    title: 'Pharmacy',
    desc: 'Full inventory control, billing, and sales tracking in one place.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: FlaskConical,
    title: 'Laboratory',
    desc: 'Test bookings, result tracking & digital report generation.',
    color: 'from-violet-500 to-violet-600',
  },
];

const STATS = [
  { icon: Shield,  label: 'Secure & Reliable' },
  { icon: Clock,   label: '24/7 Access' },
  { icon: Stethoscope, label: 'All-in-One HMS' },
];

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white dark:bg-slate-900">

      {/* Navbar */}
      <header className="shrink-0 px-8 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-blue-200 dark:shadow-blue-900">
            <img src="/logo.svg" alt="logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{CLINIC.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Healthcare Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500 mr-2">
            {STATS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>
          <Link
            to={ROUTES.LOGIN}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-200 dark:shadow-blue-900 transition-colors"
          >
            Sign In <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Left — Hero */}
        <div className="flex flex-col justify-center px-10 lg:px-16 py-8 lg:w-[45%] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-8 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Now available — Jarvis HMS v1.0
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              Smarter Healthcare<br />Management
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-8 max-w-sm">
              A unified platform for managing doctors, pharmacy, and laboratory — built for modern clinics that care about efficiency.
            </p>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right — Services + Contact */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 py-8 gap-6 bg-gray-50 dark:bg-slate-800/50">

          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Our Services</p>
            <div className="grid grid-cols-1 gap-3">
              {SERVICES.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex items-start gap-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className={`shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Contact Us</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {CLINIC.phone}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {CLINIC.email}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {CLINIC.address}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 px-8 py-2.5 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <span className="text-xs text-gray-400 dark:text-gray-500">{CLINIC.name} HMS v1.0</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Made with ❤️ by{' '}
          <a href="https://www.tmmt.in" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
            TMMT
          </a>
        </span>
      </footer>
    </div>
  );
}
