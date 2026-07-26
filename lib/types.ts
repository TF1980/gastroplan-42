export type LocationId = "castello" | "kartoffelhaus-dessau" | "kartoffelhaus-bitterfeld";
export type EntryKind = "shift" | "task";
export type AvailabilityStatus = "available" | "partial" | "unavailable" | "vacation" | "sick" | "school" | "unknown";

export type Employee = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  locationId: LocationId;
  phone?: string;
  email?: string;
};

export type ScheduleEntry = {
  id: string;
  employeeId: string;
  locationId: LocationId;
  date: string;
  kind: EntryKind;
  startTime?: string;
  endTime?: string;
  title: string;
  note?: string;
};

export type Availability = {
  id: string;
  employeeId: string;
  locationId: LocationId;
  date: string;
  status: AvailabilityStatus;
  startTime?: string;
  endTime?: string;
  note?: string;
  updatedAt: string;
};
