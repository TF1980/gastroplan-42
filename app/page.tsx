"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Availability, AvailabilityStatus, Employee, EntryKind, LocationId, ScheduleEntry } from "@/lib/types";

const locations: { id: LocationId; name: string }[] = [
  { id: "castello", name: "Ristorante Castello" },
  { id: "kartoffelhaus-dessau", name: "Kartoffelhaus Dessau" },
  { id: "kartoffelhaus-bitterfeld", name: "Kartoffelhaus Bitterfeld" },
];

const initialEmployees: Employee[] = [
  { id: "e1", name: "Anna", role: "Service", active: true, locationId: "castello" },
  { id: "e2", name: "Marco", role: "Küche", active: true, locationId: "castello" },
  { id: "e3", name: "Sophie", role: "Service", active: true, locationId: "castello" },
  { id: "e4", name: "Lukas", role: "Küche", active: true, locationId: "castello" },
];

const statusLabels: Record<AvailabilityStatus, string> = {
  available: "Verfügbar",
  partial: "Teilweise verfügbar",
  unavailable: "Nicht verfügbar",
  vacation: "Urlaub",
  sick: "Krank",
  school: "Berufsschule",
  unknown: "Keine Angabe",
};

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function startOfWeek(date: Date): Date { const result = new Date(date); const weekday = result.getDay() || 7; result.setDate(result.getDate() - weekday + 1); result.setHours(12, 0, 0, 0); return result; }
function addDays(date: Date, amount: number): Date { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function formatDay(date: Date): string { return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date); }
function formatRange(start: Date): string { const end = addDays(start, 6); return `${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(start)} – ${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(end)}`; }

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [locationId, setLocationId] = useState<LocationId>("castello");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [view, setView] = useState<"planner" | "employee">("planner");
  const [currentEmployeeId, setCurrentEmployeeId] = useState(initialEmployees[0].id);
  const [entryOpen, setEntryOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployees[0].id);
  const [kind, setKind] = useState<EntryKind>("shift");
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("22:00");
  const [title, setTitle] = useState("Abendschicht");
  const [note, setNote] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("available");
  const [availabilityStart, setAvailabilityStart] = useState("17:00");
  const [availabilityEnd, setAvailabilityEnd] = useState("22:00");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem("gastroplan-employees");
      const storedEntries = localStorage.getItem("gastroplan-entries");
      const storedAvailability = localStorage.getItem("gastroplan-availability");
      if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
      if (storedEntries) setEntries(JSON.parse(storedEntries));
      if (storedAvailability) setAvailabilities(JSON.parse(storedAvailability));
    } catch { /* Standarddaten verwenden */ } finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("gastroplan-employees", JSON.stringify(employees));
    localStorage.setItem("gastroplan-entries", JSON.stringify(entries));
    localStorage.setItem("gastroplan-availability", JSON.stringify(availabilities));
  }, [employees, entries, availabilities, loaded]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const activeEmployees = employees.filter((employee) => employee.active && employee.locationId === locationId);
  const currentEmployee = employees.find((employee) => employee.id === currentEmployeeId) ?? activeEmployees[0];
  const missingReplies = activeEmployees.filter((employee) => weekDays.some((day) => !availabilityFor(employee.id, day))).length;

  function availabilityFor(employeeId: string, date: Date) { return availabilities.find((item) => item.employeeId === employeeId && item.date === isoDate(date) && item.locationId === locationId); }
  function entriesFor(employeeId: string, date: Date) { return entries.filter((entry) => entry.employeeId === employeeId && entry.date === isoDate(date) && entry.locationId === locationId); }

  function openAvailability(employeeId: string, date: Date) {
    const existing = availabilityFor(employeeId, date);
    setSelectedEmployeeId(employeeId); setSelectedDate(isoDate(date));
    setAvailabilityStatus(existing?.status ?? "available");
    setAvailabilityStart(existing?.startTime ?? "17:00"); setAvailabilityEnd(existing?.endTime ?? "22:00");
    setAvailabilityNote(existing?.note ?? ""); setAvailabilityOpen(true);
  }

  function saveAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Availability = {
      id: availabilities.find((item) => item.employeeId === selectedEmployeeId && item.date === selectedDate)?.id ?? crypto.randomUUID(),
      employeeId: selectedEmployeeId, locationId, date: selectedDate, status: availabilityStatus,
      ...(availabilityStatus === "partial" ? { startTime: availabilityStart, endTime: availabilityEnd } : {}),
      note: availabilityNote.trim() || undefined, updatedAt: new Date().toISOString(),
    };
    setAvailabilities((items) => [...items.filter((item) => !(item.employeeId === selectedEmployeeId && item.date === selectedDate && item.locationId === locationId)), next]);
    setAvailabilityOpen(false);
  }

  function openEntry(employeeId: string, date: Date) { setSelectedEmployeeId(employeeId); setSelectedDate(isoDate(date)); setEntryOpen(true); }
  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const availability = availabilities.find((item) => item.employeeId === selectedEmployeeId && item.date === selectedDate && item.locationId === locationId);
    if (kind === "shift" && availability && ["unavailable", "vacation", "sick", "school"].includes(availability.status)) {
      const proceed = window.confirm(`Achtung: ${statusLabels[availability.status]}. Schicht trotzdem eintragen?`);
      if (!proceed) return;
    }
    setEntries((items) => [...items, { id: crypto.randomUUID(), employeeId: selectedEmployeeId, locationId, date: selectedDate, kind, title: title.trim(), note: note.trim() || undefined, ...(kind === "shift" ? { startTime, endTime } : {}) }]);
    setEntryOpen(false); setNote("");
  }
  function deleteEntry(id: string) { setEntries((items) => items.filter((item) => item.id !== id)); }

  return (
  <main style={{ padding: 30, fontFamily: "Arial, sans-serif" }}>
    <h1>GastroPlan – Supabase Test</h1>

    <p>{status}</p>

    <h2>🏢 Restaurants</h2>
    <ul>
      {locations.map((location) => (
        <li key={location.id}>
          <strong>{location.name}</strong> – {location.city}
        </li>
      ))}
    </ul>

    <h2>👥 Mitarbeiter</h2>
    <ul>
      {employees.map((employee) => (
        <li key={employee.id}>
          <strong>{employee.first_name}</strong> – {employee.position} (
          {employee.weekly_hours} Std.) –{" "}
          {employee.locations?.name ?? "Kein Betrieb"}
        </li>
      ))}
    </ul>
  </main>
);
}
