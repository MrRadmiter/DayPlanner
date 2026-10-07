import { useEffect, useMemo, useState } from "react";
import { Button, Field, Icon, TextArea } from "./components/ui";

type Category = "Study" | "Personal" | "Health";
type Priority = "High" | "Medium" | "Low";

type Entry = {
  id: number;
  title: string;
  date: string;
  start: string;
  end?: string;
  category: Category;
  priority: Priority;
  notes?: string;
  done: boolean;
};

const categories: Array<"All" | Category> = ["All", "Study", "Personal", "Health"];

const getTodayString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatFullDate = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

function loadEntries(): Entry[] {
  try {
    const value = localStorage.getItem("daymark.entries");
    return value ? (JSON.parse(value) as Entry[]) : [];
  } catch {
    return [];
  }
}

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(loadEntries);
  const [activeView, setActiveView] = useState<"Today" | "Week">("Today");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [dark, setDark] = useState(() => localStorage.getItem("daymark.theme") === "dark");

  const todayStr = useMemo(() => getTodayString(), []);

  useEffect(() => {
    localStorage.setItem("daymark.entries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("daymark.theme", dark ? "dark" : "light");
  }, [dark]);

  const todayEntries = useMemo(
    () => entries.filter((entry) => entry.date === todayStr),
                               [entries, todayStr]
  );

  const filtered = useMemo(
    () =>
    todayEntries
    .filter((entry) => category === "All" || entry.category === category)
    .filter((entry) => entry.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.start.localeCompare(b.start)),
                           [todayEntries, category, query]
  );

  const completed = todayEntries.filter((entry) => entry.done).length;
  const percent = todayEntries.length ? Math.round((completed / todayEntries.length) * 100) : 0;

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const saveEntry = (entry: Entry) => {
    setEntries((current) => {
      const exists = current.some((item) => item.id === entry.id);
      return exists ? current.map((item) => (item.id === entry.id ? entry : item)) : [...current, entry];
    });
    setEditorOpen(false);
  };

  const exportJson = () => {
    downloadFile("daymark-backup.json", JSON.stringify(entries, null, 2), "application/json");
  };

  const exportIcs = () => {
    const events = entries
    .map(
      (entry) =>
      `BEGIN:VEVENT\nUID:${entry.id}@daymark.local\nDTSTART:${entry.date.replaceAll("-", "")}T${entry.start.replace(":", "")}00\nSUMMARY:${entry.title}\nEND:VEVENT`
    )
    .join("\n");
    downloadFile("daymark-schedule.ics", `BEGIN:VCALENDAR\nVERSION:2.0\n${events}\nEND:VCALENDAR`, "text/calendar");
  };

  return (
    <div className="app-shell">
    <aside className="sidebar">
    <div className="brand">
    <div className="brand-mark"><Icon name="check" /></div>
    <div className="brand-name">daymark</div>
    </div>

    <nav className="nav-stack" aria-label="Main navigation">
    <Button
    variant={activeView === "Today" ? "nav-active" : "nav"}
    onClick={() => setActiveView("Today")}
    icon="sun"
    >
    Today
    </Button>
    <Button
    variant={activeView === "Week" ? "nav-active" : "nav"}
    onClick={() => setActiveView("Week")}
    icon="calendar"
    >
    Week
    </Button>
    </nav>

    <div className="sidebar-bottom">
    <div className="privacy-card">
    <div className="privacy-icon"><Icon name="shield" /></div>
    <div>
    <div className="privacy-title">Local storage mode</div>
    <div className="privacy-copy">Data is stored exclusively in this browser.</div>
    </div>
    </div>
    <Button variant="nav" onClick={() => setDark((value) => !value)} icon={dark ? "sun" : "moon"}>
    {dark ? "Light mode" : "Dark mode"}
    </Button>
    </div>
    </aside>

    <main className="main">
    <header className="mobile-header">
    <div className="brand">
    <div className="brand-mark"><Icon name="check" /></div>
    <div className="brand-name">daymark</div>
    </div>
    <Button variant="icon" label="Toggle theme" onClick={() => setDark((value) => !value)} icon="moon" />
    </header>

    {activeView === "Today" ? (
      <>
      <section className="page-heading">
      <div>
      <div className="eyebrow">TODAY</div>
      <div className="page-title">{formatFullDate(todayStr)}</div>
      <div className="page-subtitle">Daily task schedule and overview.</div>
      </div>
      <Button variant="primary" onClick={openNew} icon="plus">New entry</Button>
      </section>

      <section className="progress-card">
      <div className="progress-top">
      <div>
      <div className="card-label">DAILY PROGRESS</div>
      <div className="progress-copy">
      <strong>{completed}</strong> of {todayEntries.length} entries complete
      </div>
      </div>
      <div className="progress-percent">{percent}%</div>
      </div>
      <div className="progress-track">
      <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      </section>

      <section className="toolbar">
      <Field
      className="search-field"
      aria-label="Search entries"
      placeholder="Filter tasks..."
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      leadingIcon="search"
      />
      <div className="filter-group" aria-label="Filter by category">
      {categories.map((item) => (
        <Button
        key={item}
        variant={category === item ? "filter-active" : "filter"}
        onClick={() => setCategory(item)}
        >
        {item}
        </Button>
      ))}
      </div>
      </section>

      <section className="timeline">
      {filtered.length ? (
        filtered.map((entry) => (
          <article className={`entry ${entry.done ? "entry-done" : ""}`} key={entry.id}>
          <div className="entry-time">
          <span>{entry.start}</span>
          {entry.end && <small>{entry.end}</small>}
          </div>
          <Button
          variant={entry.done ? "check-active" : "check"}
          label={entry.done ? `Mark ${entry.title} incomplete` : `Mark ${entry.title} complete`}
          icon="check"
          onClick={() =>
            setEntries((current) =>
            current.map((item) => (item.id === entry.id ? { ...item, done: !item.done } : item))
            )
          }
          />
          <div className="entry-body" onClick={() => { setEditing(entry); setEditorOpen(true); }}>
          <div className="entry-title">{entry.title}</div>
          <div className="entry-meta">
          <span className={`category-dot category-${entry.category.toLowerCase()}`} />
          {entry.category}
          {entry.notes && <><span className="meta-separator" />{entry.notes}</>}
          </div>
          </div>
          <div className={`priority priority-${entry.priority.toLowerCase()}`}>{entry.priority}</div>
          <Button
          variant="more"
          label={`Edit ${entry.title}`}
          icon="chevron"
          onClick={() => { setEditing(entry); setEditorOpen(true); }}
          />
          </article>
        ))
      ) : (
        <div className="empty-state">
        <div className="empty-icon"><Icon name="search" /></div>
        <div className="empty-title">No entries found</div>
        <div className="empty-copy">No tasks match the current filter or date.</div>
        </div>
      )}
      </section>
      </>
    ) : (
      <WeekView entries={entries} onExportJson={exportJson} onExportIcs={exportIcs} />
    )}
    </main>

    <nav className="mobile-nav" aria-label="Mobile navigation">
    <Button variant={activeView === "Today" ? "mobile-active" : "mobile"} icon="sun" onClick={() => setActiveView("Today")}>Today</Button>
    <Button variant="mobile-create" label="New entry" icon="plus" onClick={openNew} />
    <Button variant={activeView === "Week" ? "mobile-active" : "mobile"} icon="calendar" onClick={() => setActiveView("Week")}>Week</Button>
    </nav>

    {editorOpen && (
      <EntryEditor
      entry={editing}
      todayStr={todayStr}
      onClose={() => setEditorOpen(false)}
      onSave={saveEntry}
      onDelete={
        editing
        ? () => {
          setEntries((current) => current.filter((entry) => entry.id !== editing.id));
          setEditorOpen(false);
        }
        : undefined
      }
      />
    )}
    </div>
  );
}

function WeekView({
  entries,
  onExportJson,
  onExportIcs,
}: {
  entries: Entry[];
  onExportJson: () => void;
  onExportIcs: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => getStartOfWeek(today), [today]);

  const weekDays = useMemo(() => {
    const days = [];
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getTodayString(d);
      const dayEntries = entries.filter((e) => e.date === dateStr);
      days.push({
        name: names[i],
        dateNum: d.getDate(),
                fullDateStr: dateStr,
                total: dayEntries.length,
                completed: dayEntries.filter((e) => e.done).length,
                isToday: dateStr === getTodayString(today),
      });
    }
    return days;
  }, [entries, monday, today]);

  const totalWeekly = useMemo(() => weekDays.reduce((acc, d) => acc + d.total, 0), [weekDays]);
  const completedWeekly = useMemo(() => weekDays.reduce((acc, d) => acc + d.completed, 0), [weekDays]);
  const weeklyPercent = totalWeekly ? Math.round((completedWeekly / totalWeekly) * 100) : 0;

  const maxDailyTasks = useMemo(() => Math.max(...weekDays.map((d) => d.total), 1), [weekDays]);

  const sunday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + 6);
    return d;
  }, [monday]);

  const rangeLabel = `${monday.getDate()}–${sunday.getDate()} ${sunday.toLocaleDateString("en-US", { month: "short" })}`;

  return (
    <>
    <section className="page-heading">
    <div>
    <div className="eyebrow">WEEKLY OVERVIEW</div>
    <div className="page-title">{rangeLabel}</div>
    <div className="page-subtitle">Summary of tasks for the current week.</div>
    </div>
    <div className="export-actions">
    <Button variant="secondary" icon="download" onClick={onExportJson}>Export JSON</Button>
    <Button variant="primary" icon="calendar" onClick={onExportIcs}>Export .ics</Button>
    </div>
    </section>

    <section className="week-summary">
    <div>
    <div className="card-label">WEEKLY LOAD</div>
    <div className="summary-number">{totalWeekly}</div>
    <div className="summary-caption">total tasks</div>
    </div>
    <div className="summary-divider" />
    <div>
    <div className="card-label">COMPLETED</div>
    <div className="summary-number">{completedWeekly}</div>
    <div className="summary-caption">{weeklyPercent}% completion rate</div>
    </div>
    <div className="week-bars">
    {weekDays.map((day) => (
      <div className="day-column" key={day.name}>
      <div className="bar-track">
      <div
      className="bar-fill"
      style={{ height: `${(day.total / maxDailyTasks) * 100}%` }}
      />
      </div>
      <span>{day.name}</span>
      <strong className={day.isToday ? "today-date" : ""}>{day.dateNum}</strong>
      </div>
    ))}
    </div>
    </section>

    <section className="week-notice">
    <Icon name="shield" />
    <div>
    <div className="privacy-title">Local Data Control</div>
    <div className="privacy-copy">Data resides locally in the browser storage.</div>
    </div>
    </section>
    </>
  );
}

function EntryEditor({
  entry,
  todayStr,
  onClose,
  onSave,
  onDelete,
}: {
  entry: Entry | null;
  todayStr: string;
  onClose: () => void;
  onSave: (entry: Entry) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Entry>(
    entry ?? {
      id: Date.now(),
                                          title: "",
                                          date: todayStr,
                                          start: "09:00",
                                          end: "10:00",
                                          category: "Study",
                                          priority: "Medium",
                                          notes: "",
                                          done: false,
    }
  );

  const update = <K extends keyof Entry>(key: K, value: Entry[K]) =>
  setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
    <section
    className="modal"
    role="dialog"
    aria-modal="true"
    aria-label={entry ? "Edit entry" : "New entry"}
    onMouseDown={(event) => event.stopPropagation()}
    >
    <div className="modal-header">
    <div>
    <div className="eyebrow">{entry ? "EDIT ENTRY" : "NEW ENTRY"}</div>
    <div className="modal-title">{entry ? "Edit task details" : "Create new task"}</div>
    </div>
    <Button variant="icon" label="Close" icon="close" onClick={onClose} />
    </div>
    <div className="form-stack">
    <Field
    label="Title"
    value={form.title}
    placeholder="Task title..."
    autoFocus
    onChange={(event) => update("title", event.target.value)}
    />
    <div className="form-grid">
    <Field label="Date" type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
    <Field label="Start time" type="time" value={form.start} onChange={(event) => update("start", event.target.value)} />
    <Field label="End time" type="time" value={form.end} onChange={(event) => update("end", event.target.value)} />
    </div>
    <div className="form-grid two">
    <div className="choice-field">
    <div className="field-label">Category</div>
    <div className="segmented">
    {(["Study", "Personal", "Health"] as Category[]).map((item) => (
      <Button
      key={item}
      variant={form.category === item ? "segment-active" : "segment"}
      onClick={() => update("category", item)}
      >
      {item}
      </Button>
    ))}
    </div>
    </div>
    <div className="choice-field">
    <div className="field-label">Priority</div>
    <div className="segmented">
    {(["High", "Medium", "Low"] as Priority[]).map((item) => (
      <Button
      key={item}
      variant={form.priority === item ? "segment-active" : "segment"}
      onClick={() => update("priority", item)}
      >
      {item}
      </Button>
    ))}
    </div>
    </div>
    </div>
    <TextArea
    label="Notes"
    value={form.notes}
    placeholder="Additional details..."
    onChange={(event) => update("notes", event.target.value)}
    />
    </div>
    <div className="modal-footer">
    {onDelete ? <Button variant="danger" icon="trash" onClick={onDelete}>Delete</Button> : <span />}
    <div className="footer-actions">
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" icon="check" disabled={!form.title.trim()} onClick={() => onSave(form)}>Save entry</Button>
    </div>
    </div>
    </section>
    </div>
  );
}
