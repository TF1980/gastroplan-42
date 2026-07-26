"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Employee, EntryKind, LocationId, ScheduleEntry } from "@/lib/types";

const locations: { id: LocationId; name: string }[] = [
  { id: "castello", name: "Ristorante Castello" },
  { id: "kartoffelhaus-dessau", name: "Kartoffelhaus Dessau" },
  { id: "kartoffelhaus-bitterfeld", name: "Kartoffelhaus Bitterfeld" },
];

const initialEmployees: Employee[] = [
  { id: "e1", name: "Anna", role: "Service", active: true },
  { id: "e2", name: "Marco", role: "Küche", active: true },
  { id: "e3", name: "Sophie", role: "Service", active: true },
  { id: "e4", name: "Lukas", role: "Küche", active: true },
];

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const weekday = result.getDay() || 7;
  result.setDate(result.getDate() - weekday + 1);
  result.setHours(12, 0, 0, 0);
  return result;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date);
}

function formatRange(start: Date): string {
  const end = addDays(start, 6);
  return `${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(start)} – ${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(end)}`;
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [locationId, setLocationId] = useState<LocationId>("castello");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [kind, setKind] = useState<EntryKind>("shift");
  const [employeeId, setEmployeeId] = useState(initialEmployees[0].id);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("22:00");
  const [title, setTitle] = useState("Abendschicht");
  const [note, setNote] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("Service");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem("gastroplan-employees");
      const storedEntries = localStorage.getItem("gastroplan-entries");
      if (storedEmployees) setEmployees(JSON.parse(storedEmployees) as Employee[]);
      if (storedEntries) setEntries(JSON.parse(storedEntries) as ScheduleEntry[]);
    } catch {
      // Bei beschädigten lokalen Daten startet die App mit den Standardwerten.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("gastroplan-employees", JSON.stringify(employees));
    localStorage.setItem("gastroplan-entries", JSON.stringify(entries));
  }, [employees, entries, loaded]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const activeEmployees = employees.filter((employee) => employee.active);

  function openEntry(date: Date) {
    setSelectedDate(isoDate(date));
    setDialogOpen(true);
  }

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!employeeId || !title.trim()) return;

    const entry: ScheduleEntry = {
      id: crypto.randomUUID(),
      employeeId,
      locationId,
      date: selectedDate,
      kind,
      title: title.trim(),
      note: note.trim() || undefined,
      ...(kind === "shift" ? { startTime, endTime } : {}),
    };

    setEntries((current) => [...current, entry]);
    setDialogOpen(false);
    setNote("");
  }

  function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newEmployeeName.trim()) return;
    const employee: Employee = {
      id: crypto.randomUUID(),
      name: newEmployeeName.trim(),
      role: newEmployeeRole.trim() || "Mitarbeiter",
      active: true,
    };
    setEmployees((current) => [...current, employee]);
    setEmployeeId(employee.id);
    setNewEmployeeName("");
    setEmployeeDialogOpen(false);
  }

  function deleteEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function entriesFor(employeeIdValue: string, date: Date) {
    return entries.filter(
      (entry) => entry.employeeId === employeeIdValue && entry.date === isoDate(date) && entry.locationId === locationId,
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Gastronomie-Dienstplan</p>
          <h1>GastroPlan <span>4.2</span></h1>
        </div>
        <button className="secondary" onClick={() => setEmployeeDialogOpen(true)}>+ Mitarbeiter</button>
      </header>

      <section className="toolbar card">
        <label>
          <span>Betrieb</span>
          <select value={locationId} onChange={(event) => setLocationId(event.target.value as LocationId)}>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
        <div className="weeknav">
          <button aria-label="Vorherige Woche" onClick={() => setWeekStart(addDays(weekStart, -7))}>←</button>
          <strong>{formatRange(weekStart)}</strong>
          <button aria-label="Nächste Woche" onClick={() => setWeekStart(addDays(weekStart, 7))}>→</button>
        </div>
        <button className="primary" onClick={() => openEntry(new Date())}>+ Eintrag</button>
      </section>

      <section className="planner card" aria-label="Wochenplan">
        <div className="planner-grid header-row">
          <div className="employee-head">Mitarbeiter</div>
          {weekDays.map((day) => (
            <button className="day-head" key={isoDate(day)} onClick={() => openEntry(day)}>
              {formatDay(day)}<span>+</span>
            </button>
          ))}
        </div>

        {activeEmployees.map((employee) => (
          <div className="planner-grid employee-row" key={employee.id}>
            <div className="employee-cell"><strong>{employee.name}</strong><small>{employee.role}</small></div>
            {weekDays.map((day) => {
              const dayEntries = entriesFor(employee.id, day);
              return (
                <div className="day-cell" key={isoDate(day)} onDoubleClick={() => openEntry(day)}>
                  {dayEntries.map((entry) => (
                    <article className={`entry ${entry.kind}`} key={entry.id}>
                      <button className="delete" title="Eintrag löschen" onClick={() => deleteEntry(entry.id)}>×</button>
                      <strong>{entry.title}</strong>
                      {entry.kind === "shift" && <span>{entry.startTime}–{entry.endTime}</span>}
                      {entry.kind === "task" && <span>Aufgabe / Freitext</span>}
                      {entry.note && <small>{entry.note}</small>}
                    </article>
                  ))}
                  {dayEntries.length === 0 && <button className="empty-add" onClick={() => { setEmployeeId(employee.id); openEntry(day); }}>+</button>}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <p className="status">Daten werden auf diesem Gerät gespeichert. Supabase kann anschließend in Vercel aktiviert werden.</p>

      {dialogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDialogOpen(false)}>
          <form className="modal" onSubmit={addEntry} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title"><h2>Eintrag anlegen</h2><button type="button" onClick={() => setDialogOpen(false)}>×</button></div>
            <label><span>Datum</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} required /></label>
            <label><span>Mitarbeiter</span><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>{activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} – {employee.role}</option>)}</select></label>
            <div className="kind-switch">
              <button type="button" className={kind === "shift" ? "active" : ""} onClick={() => { setKind("shift"); setTitle("Abendschicht"); }}>Schicht</button>
              <button type="button" className={kind === "task" ? "active" : ""} onClick={() => { setKind("task"); setTitle("Vorbereitung"); }}>Freitext / Aufgabe</button>
            </div>
            <label><span>Bezeichnung</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === "task" ? "z. B. Stadtfest, Putzen, Inventur" : "z. B. Abendschicht"} required /></label>
            {kind === "shift" && <div className="time-row"><label><span>Beginn</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></label><label><span>Ende</span><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></label></div>}
            <label><span>Hinweis (optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} /></label>
            <button className="primary full" type="submit">Eintrag speichern</button>
          </form>
        </div>
      )}

      {employeeDialogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEmployeeDialogOpen(false)}>
          <form className="modal" onSubmit={addEmployee} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title"><h2>Mitarbeiter anlegen</h2><button type="button" onClick={() => setEmployeeDialogOpen(false)}>×</button></div>
            <label><span>Name</span><input value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} required /></label>
            <label><span>Bereich / Rolle</span><input value={newEmployeeRole} onChange={(event) => setNewEmployeeRole(event.target.value)} /></label>
            <button className="primary full" type="submit">Mitarbeiter speichern</button>
          </form>
        </div>
      )}
    </main>
  );
}
