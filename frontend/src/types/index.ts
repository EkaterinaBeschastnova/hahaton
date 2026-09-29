export type HouseStateLevel = "attention" | "urgent";

export type HouseStateReason = {
  kind: "event" | "meter" | "request" | "repair";
  label: string;
  detail: string;
  sourceId?: number | null;
};

export type HouseState = {
  level: HouseStateLevel | null;
  label: string | null;
  reasons: HouseStateReason[];
};

export type MeterItem = {
  id: number;
  buildingId: number;
  kind: string;
  name: string;
  unit: string;
  lastValue: string;
  lastSubmittedAt?: string | null;
  nextSubmissionDate?: string | null;
  submissionRequired: boolean;
};

export type EventSeverity = "info" | "attention" | "urgent";
export type EventType =
  | "important"
  | "work"
  | "announcement"
  | "useful"
  | "good";

export type EventItem = {
  id: number;
  buildingId: number;
  type: EventType;
  severity: EventSeverity;
  title: string;
  body: string;
  date: string;
  icon?: string;
  requiresAttention: boolean;
  resolved: boolean;
  startsAt?: string | null;
};

export type RequestStatus =
  | "NEW"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "WAITING"
  | "DONE"
  | "CANCELLED"
  | string;

export type RequestItem = {
  id: number;
  buildingId: number;
  category: string;
  description: string;
  status: RequestStatus;
  createdAt?: string;
  residents?: number;
  isMine?: boolean;
  collective?: boolean;
  canEdit?: boolean;
};

export type RepairItem = {
  id: number;
  buildingId: number;
  title: string;
  description: string;
  status: "PLANNED" | "IN_PROGRESS" | "DONE" | string;
  year: number;
  severity: EventSeverity;
  requiresAttention: boolean;
};

export type House = {
  id: number;
  address: string;
  city: string;
  district: string;
  street: string;
  houseNumber: string;
  apartment?: string;
  relation?: string;
  year: number;
  floors: number;
  entrances: number;
  apartments: number;
  type: string;
  area: string;
  company: string;
  emergencyPhone?: string;
  image?: string;
  state?: HouseState;
  meters: MeterItem[];
  events: EventItem[];
  requests: RequestItem[];
  repairs: RepairItem[];
};

export type HouseTab =
  | "События"
  | "Заявки"
  | "Счётчики"
  | "Капремонт"
  | "О доме";

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  max_user_id?: string | null;
  phone?: string;
  authProvider?: "phone" | "gosuslugi" | "max";
};

export type Screen =
  | "home"
  | "feed"
  | "profile"
  | "house"
  | "add-house"
  | "create-request"
  | "notifications"
  | "settings"
  | "security"
  | "request-detail"
  | "event-detail";
