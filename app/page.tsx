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
    <main className="shell">
      <header className="topbar">
        <div><p className="eyebrow">Gastronomie-Personalplanung</p><h1>GastroPlan <span>4.4</span></h1></div>
        <div className="view-switch"><button className={view === "planner" ? "active" : ""} onClick={() => setView("planner")}>Planer</button><button className={view === "employee" ? "active" : ""} onClick={() => setView("employee")}>Mitarbeiter</button></div>
      </header>

      <section className="toolbar card">
        <label><span>Betrieb</span><select value={locationId} onChange={(event) => setLocationId(event.target.value as LocationId)}>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <div className="weeknav"><button onClick={() => setWeekStart(addDays(weekStart, -7))}>←</button><strong>{formatRange(weekStart)}</strong><button onClick={() => setWeekStart(addDays(weekStart, 7))}>→</button></div>
        {view === "planner" ? <div className="reply-summary"><strong>{missingReplies}</strong><span>Mitarbeiter ohne vollständige Rückmeldung</span></div> : <label><span>Mitarbeiter</span><select value={currentEmployee?.id ?? ""} onChange={(event) => setCurrentEmployeeId(event.target.value)}>{activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>}
      </section>

      {view === "planner" ? (
        <section className="planner card">
          <div className="planner-grid header-row"><div className="employee-head">Mitarbeiter</div>{weekDays.map((day) => <div className="day-head" key={isoDate(day)}>{formatDay(day)}</div>)}</div>
          {activeEmployees.map((employee) => (
            <div className="planner-grid employee-row" key={employee.id}>
              <div className="employee-cell"><strong>{employee.name}</strong><small>{employee.role}</small></div>
              {weekDays.map((day) => {
                const availability = availabilityFor(employee.id, day); const dayEntries = entriesFor(employee.id, day);
                return <div className="day-cell" key={isoDate(day)}>
                  <button className={`availability-pill ${availability?.status ?? "unknown"}`} onClick={() => openAvailability(employee.id, day)}>{availability ? statusLabels[availability.status] : "Keine Angabe"}{availability?.status === "partial" && <span>{availability.startTime}–{availability.endTime}</span>}</button>
                  {dayEntries.map((entry) => <article className={`entry ${entry.kind}`} key={entry.id}><button className="delete" onClick={() => deleteEntry(entry.id)}>×</button><strong>{entry.title}</strong>{entry.kind === "shift" && <span>{entry.startTime}–{entry.endTime}</span>}{entry.note && <small>{entry.note}</small>}</article>)}
                  <button className="add-shift" onClick={() => openEntry(employee.id, day)}>+ Schicht</button>
                </div>;
              })}
            </div>
          ))}
        </section>
      ) : (
        <section className="employee-availability card">
          <div className="employee-intro"><div><p className="eyebrow">Meine Verfügbarkeit</p><h2>{currentEmployee?.name ?? "Mitarbeiter"}</h2><p>Bitte für jeden Tag eine Rückmeldung eintragen. Teilweise Verfügbarkeit kann mit Uhrzeit angegeben werden.</p></div><span className="week-badge">{formatRange(weekStart)}</span></div>
          <div className="availability-cards">{weekDays.map((day) => { const availability = currentEmployee ? availabilityFor(currentEmployee.id, day) : undefined; return <button className={`availability-card ${availability?.status ?? "unknown"}`} key={isoDate(day)} onClick={() => currentEmployee && openAvailability(currentEmployee.id, day)}><strong>{formatDay(day)}</strong><span>{availability ? statusLabels[availability.status] : "Noch keine Angabe"}</span>{availability?.status === "partial" && <small>{availability.startTime}–{availability.endTime}</small>}{availability?.note && <small>{availability.note}</small>}</button>; })}</div>
        </section>
      )}

      <p className="status">Version 4.4 speichert Verfügbarkeiten und Dienstplan zunächst auf diesem Gerät. Die Supabase-Struktur ist vorbereitet.</p>

      {availabilityOpen && <div className="modal-backdrop" onMouseDown={() => setAvailabilityOpen(false)}><form className="modal" onSubmit={saveAvailability} onMouseDown={(event) => event.stopPropagation()}><div className="modal-title"><h2>Verfügbarkeit eintragen</h2><button type="button" onClick={() => setAvailabilityOpen(false)}>×</button></div><label><span>Status</span><select value={availabilityStatus} onChange={(event) => setAvailabilityStatus(event.target.value as AvailabilityStatus)}>{Object.entries(statusLabels).filter(([key]) => key !== "unknown").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{availabilityStatus === "partial" && <div className="time-row"><label><span>Von</span><input type="time" value={availabilityStart} onChange={(event) => setAvailabilityStart(event.target.value)} /></label><label><span>Bis</span><input type="time" value={availabilityEnd} onChange={(event) => setAvailabilityEnd(event.target.value)} /></label></div>}<label><span>Bemerkung (optional)</span><textarea rows={3} value={availabilityNote} onChange={(event) => setAvailabilityNote(event.target.value)} placeholder="z. B. Kinderbetreuung, Arzttermin" /></label><button className="primary full" type="submit">Verfügbarkeit speichern</button></form></div>}

      {entryOpen && <div className="modal-backdrop" onMouseDown={() => setEntryOpen(false)}><form className="modal" onSubmit={addEntry} onMouseDown={(event) => event.stopPropagation()}><div className="modal-title"><h2>Eintrag anlegen</h2><button type="button" onClick={() => setEntryOpen(false)}>×</button></div><div className="kind-switch"><button type="button" className={kind === "shift" ? "active" : ""} onClick={() => { setKind("shift"); setTitle("Abendschicht"); }}>Schicht</button><button type="button" className={kind === "task" ? "active" : ""} onClick={() => { setKind("task"); setTitle("Vorbereitung"); }}>Aufgabe</button></div><label><span>Bezeichnung</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>{kind === "shift" && <div className="time-row"><label><span>Beginn</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label><span>Ende</span><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label></div>}<label><span>Hinweis</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label><button className="primary full" type="submit">Speichern</button></form></div>}
    </main>
  );
}
