"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Employee, EntryKind, LocationId, ScheduleEntry } from "@/lib/types";

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
  const [employeeManagerOpen, setEmployeeManagerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [kind, setKind] = useState<EntryKind>("shift");
  const [employeeId, setEmployeeId] = useState(initialEmployees[0].id);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("22:00");
  const [title, setTitle] = useState("Abendschicht");
  const [note, setNote] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("Service");
  const [newEmployeeLocationId, setNewEmployeeLocationId] = useState<LocationId>("castello");
  const [newEmployeePhone, setNewEmployeePhone] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem("gastroplan-employees");
      const storedEntries = localStorage.getItem("gastroplan-entries");
      if (storedEmployees) {
        const parsed = JSON.parse(storedEmployees) as Array<Partial<Employee> & Pick<Employee, "id" | "name" | "role" | "active">>;
        setEmployees(parsed.map((employee) => ({
          ...employee,
          locationId: employee.locationId ?? "castello",
        })) as Employee[]);
      }
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
  const activeEmployees = employees.filter((employee) => employee.active && employee.locationId === locationId);

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


  function openEmployeeDialog(employee?: Employee) {
    if (employee) {
      setEditingEmployeeId(employee.id);
      setNewEmployeeName(employee.name);
      setNewEmployeeRole(employee.role);
      setNewEmployeeLocationId(employee.locationId);
      setNewEmployeePhone(employee.phone ?? "");
      setNewEmployeeEmail(employee.email ?? "");
    } else {
      setEditingEmployeeId(null);
      setNewEmployeeName("");
      setNewEmployeeRole("Service");
      setNewEmployeeLocationId(locationId);
      setNewEmployeePhone("");
      setNewEmployeeEmail("");
    }
    setEmployeeDialogOpen(true);
  }

  function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newEmployeeName.trim()) return;

    if (editingEmployeeId) {
      setEmployees((current) => current.map((employee) => employee.id === editingEmployeeId ? {
        ...employee,
        name: newEmployeeName.trim(),
        role: newEmployeeRole.trim() || "Mitarbeiter",
        locationId: newEmployeeLocationId,
        phone: newEmployeePhone.trim() || undefined,
        email: newEmployeeEmail.trim() || undefined,
      } : employee));
    } else {
      const employee: Employee = {
        id: crypto.randomUUID(),
        name: newEmployeeName.trim(),
        role: newEmployeeRole.trim() || "Mitarbeiter",
        active: true,
        locationId: newEmployeeLocationId,
        phone: newEmployeePhone.trim() || undefined,
        email: newEmployeeEmail.trim() || undefined,
      };
      setEmployees((current) => [...current, employee]);
      setEmployeeId(employee.id);
    }

    setEditingEmployeeId(null);
    setNewEmployeeName("");
    setNewEmployeeRole("Service");
    setNewEmployeeLocationId(locationId);
    setNewEmployeePhone("");
    setNewEmployeeEmail("");
    setEmployeeDialogOpen(false);
  }

  function toggleEmployeeActive(id: string) {
    setEmployees((current) => current.map((employee) => employee.id === id ? { ...employee, active: !employee.active } : employee));
  }

  function deleteEmployee(id: string) {
    const hasEntries = entries.some((entry) => entry.employeeId === id);
    if (hasEntries) {
      window.alert("Dieser Mitarbeiter hat bereits Dienstplaneinträge und kann deshalb nicht gelöscht werden. Bitte stattdessen deaktivieren.");
      return;
    }
    if (window.confirm("Mitarbeiter wirklich löschen?")) {
      setEmployees((current) => current.filter((employee) => employee.id !== id));
    }
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
          <h1>GastroPlan <span>4.3</span></h1>
        </div>
        <div className="top-actions"><button className="secondary" onClick={() => setEmployeeManagerOpen(true)}>Mitarbeiter verwalten</button><button className="secondary" onClick={() => openEmployeeDialog()}>+ Mitarbeiter</button></div>
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
            <div className="employee-cell"><div className="employee-main"><strong>{employee.name}</strong><small>{employee.role}</small></div><div className="employee-actions"><button title="Mitarbeiter bearbeiten" onClick={() => openEmployeeDialog(employee)}>✎</button><button title={employee.active ? "Mitarbeiter deaktivieren" : "Mitarbeiter aktivieren"} onClick={() => toggleEmployeeActive(employee.id)}>{employee.active ? "⏸" : "▶"}</button><button title="Mitarbeiter löschen" onClick={() => deleteEmployee(employee.id)}>🗑</button></div></div>
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

      {employeeManagerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEmployeeManagerOpen(false)}>
          <section className="modal employee-manager" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title"><h2>Mitarbeiter verwalten</h2><button type="button" onClick={() => setEmployeeManagerOpen(false)}>×</button></div>
            <div className="manager-list">
              {employees.map((employee) => (
                <article className={`manager-item ${employee.active ? "" : "inactive"}`} key={employee.id}>
                  <div><strong>{employee.name}</strong><span>{employee.role} · {locations.find((location) => location.id === employee.locationId)?.name}</span>{employee.phone && <small>{employee.phone}</small>}{employee.email && <small>{employee.email}</small>}</div>
                  <div className="manager-actions"><button type="button" onClick={() => { setEmployeeManagerOpen(false); openEmployeeDialog(employee); }}>Bearbeiten</button><button type="button" onClick={() => toggleEmployeeActive(employee.id)}>{employee.active ? "Deaktivieren" : "Aktivieren"}</button><button type="button" className="danger" onClick={() => deleteEmployee(employee.id)}>Löschen</button></div>
                </article>
              ))}
            </div>
            <button className="primary full" type="button" onClick={() => { setEmployeeManagerOpen(false); openEmployeeDialog(); }}>+ Neuen Mitarbeiter anlegen</button>
          </section>
        </div>
      )}

      {employeeDialogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setEmployeeDialogOpen(false)}>
          <form className="modal" onSubmit={saveEmployee} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title"><h2>{editingEmployeeId ? "Mitarbeiter bearbeiten" : "Mitarbeiter anlegen"}</h2><button type="button" onClick={() => setEmployeeDialogOpen(false)}>×</button></div>
            <label><span>Name</span><input value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} required /></label>
            <label><span>Bereich / Rolle</span><input value={newEmployeeRole} onChange={(event) => setNewEmployeeRole(event.target.value)} /></label>
            <label><span>Stammbetrieb</span><select value={newEmployeeLocationId} onChange={(event) => setNewEmployeeLocationId(event.target.value as LocationId)}>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
            <label><span>Telefon (optional)</span><input type="tel" value={newEmployeePhone} onChange={(event) => setNewEmployeePhone(event.target.value)} /></label>
            <label><span>E-Mail (optional)</span><input type="email" value={newEmployeeEmail} onChange={(event) => setNewEmployeeEmail(event.target.value)} /></label>
            <button className="primary full" type="submit">{editingEmployeeId ? "Änderungen speichern" : "Mitarbeiter speichern"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
