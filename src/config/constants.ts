
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  PHARMACIST: 'pharmacist',
  DOCTOR: 'doctor',
  LAB_STAFF: 'lab_staff',
  RECEPTIONIST: 'receptionist',
} as const;

export const GST_SLABS = [0, 5, 12, 18, 28] as const;

export const PAYMENT_METHODS = ['cash', 'upi', 'card'] as const;

export const APPOINTMENT_STATUS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

export const LAB_STATUS = ['booked', 'sample_collected', 'processing', 'completed', 'delivered'] as const;

export const PAYMENT_STATUS = ['pending', 'paid', 'refunded', 'waived'] as const;
export const MEDICINE_CATEGORIES = [
  'Tablet',
  'Capsule',
  'Strip',
  'Syrup',
  'Injection',
  'Cream',
  'Drops',
  'Powder',
  'Inhaler',
  'Suppository',
  'Other',
] as const;

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

export const CLINIC_INFO = {
  name: 'Jarvis',
  email: 'workwithmohitsingh@gmail.com',
  phone: '8981203500',
  address: 'abc, xyz place, state - pincode',
  gstNumber: '',
} as const;
