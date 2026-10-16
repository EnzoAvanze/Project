export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  role: "elder" | "caregiver";
  demo: boolean;
}
export interface Patient {
  id: string;
  name: string;
  birth_date: string | null;
}
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  instructions: string;
  version: number;
  status: "taken" | "not_taken" | "snoozed" | null;
  snooze_until: string | null;
  confirmed_at: string | null;
}
export interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  version: number;
}
export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notify: number;
  version: number;
}
export interface Alert {
  id: string;
  status: string;
  source: string;
  created_at: string;
  actor: string;
  external_status: string;
}
export interface Pain {
  id: string;
  region: string;
  side: string;
  kind: string;
  intensity: string;
  since: string;
  notes: string;
  source: string;
  created_at: string;
  external_status: string;
}
export interface Event {
  id: string;
  type: string;
  title: string;
  details: string;
  created_at: string;
}
export interface Device {
  id: string;
  name: string;
  kind: string;
  last_sync: string;
}
export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: string;
  created_at: string;
  is_read: number;
}
export interface Interaction {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}
export interface Preferences {
  medication: number;
  appointment: number;
  pain: number;
  sos: number;
  missing: number;
  grace_minutes: number;
}
export interface State {
  user: User;
  patients: Patient[];
  patient: Patient | null;
  medications: Medication[];
  appointments: Appointment[];
  contacts: Contact[];
  alerts: Alert[];
  pain: Pain[];
  events: Event[];
  devices: Device[];
  notifications: Notification[];
  preferences: Preferences;
  caregivers: { id: string; name: string }[];
  interactions: Interaction[];
  confirmations: (Event & {
    name: string;
    status: string;
    day: string;
    time: string;
  })[];
  day: string;
  server_time: string;
}
export type Page =
  | "home"
  | "medications"
  | "appointments"
  | "assistant"
  | "pain"
  | "sos"
  | "history"
  | "watch"
  | "profile";
