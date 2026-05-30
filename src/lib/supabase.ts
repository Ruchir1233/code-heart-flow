import { createClient } from "@supabase/supabase-js";

// Public-by-design: URL + publishable key are safe in client code.
// Data protection is enforced by Row Level Security policies on Supabase.
const SUPABASE_URL = "https://ogbqxqrmtezezrcmkzkp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_0ad3hcCiYRKn8t3VD32mAw_QB06ltGs";

export type Stage =
  | "New Enquiry"
  | "Site Visit Done"
  | "Estimate Sent"
  | "Price Negotiation"
  | "Order Final";

export interface Enquiry {
  id: number;
  customer_name: string;
  phone: string;
  location: string;
  requirement: string;
  stage: Stage;
  created_at: string;
  estimate_file_url?: string | null;
  estimate_uploaded_at?: string | null;
  site_visit_date?: string | null; // YYYY-MM-DD
  site_visit_notes?: string | null;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

export const STAGES: Stage[] = [
  "New Enquiry",
  "Site Visit Done",
  "Estimate Sent",
  "Price Negotiation",
  "Order Final",
];
