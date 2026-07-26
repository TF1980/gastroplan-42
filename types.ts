export type LocationId = "castello" | "kartoffelhaus-dessau" | "kartoffelhaus-bitterfeld";
export type EntryKind = "shift" | "task";

export type Employee = {
  id: string;
  name: string;
  role: string;
  active: boolean;
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
