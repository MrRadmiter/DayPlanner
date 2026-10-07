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
  const [activeView, setActiveView] = useState<"Day" | "Week" | "Month" | "All">("Day");
  const [selectedDate, setSelectedDate] = useState(() => getTodayString());
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

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

  const selectedDayEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
                                     [entries, selectedDate]
  );

  const filtered = useMemo(
    () =>
    (activeView === "All" ? entries : selectedDayEntries)
    .filter((entry) => category === "All" || entry.category === category)
    .filter((entry) => entry.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)),
                           [activeView, entries, selectedDayEntries, category, query]
  );

  const completed = selectedDayEntries.filter((entry) => entry.done).length;
  const percent = selectedDayEntries.length ? Math.round((completed / selectedDayEntries.length) * 100) : 0;

  const changeDayOffset = (offset: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + offset);
    setSelectedDate(getTodayString(d));
  };

  const openNew = (defaultDate = selectedDate) => {
    setEditing(null);
    setSelectedDate(defaultDate);
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
    variant={activeView === "Day" ? "nav-active" : "nav"}
    onClick={() => setActiveView("Day")}
    icon="sun"
    >
    Day
    </Button>
    <Button
    variant={activeView === "Week" ? "nav-active" : "nav"}
    onClick={() => setActiveView("Week")}
    icon="calendar"
    >
    Week
    </Button>
    <Button
    variant={activeView === "Month" ? "nav-active" : "nav"}
    onClick={() => setActiveView("Month")}
    icon="calendar"
    >
    Calendar
    </Button>
    <Button
    variant={activeView === "All" ? "nav-active" : "nav"}
    onClick={() => setActiveView("All")}
    icon="search"
    >
    All Tasks
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

    {activeView === "Day" || activeView === "All" ? (
      <>
      <section className="page-heading">
      <div>
      <div className="eyebrow">{activeView === "All" ? "ALL TASKS" : selectedDate === todayStr ? "TODAY" : "SELECTED DATE"}</div>
      <div className="page-title">{activeView === "All" ? "All Entries Overview" : formatFullDate(selectedDate)}</div>
      <div className="page-subtitle">
      {activeView === "All" ? `Total entries: ${entries.length}` : "Daily schedule and progress."}
      </div>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {activeView === "Day" && (
        <>
        <Button variant="secondary" onClick={() => changeDayOffset(-1)}>← Prev</Button>
        <Button variant="secondary" onClick={() => setSelectedDate(todayStr)}>Today</Button>
        <Button variant="secondary" onClick={() => changeDayOffset(1)}>Next →</Button>
        </>
      )}
      <Button variant="primary" onClick={() => openNew(selectedDate)} icon="plus">New entry</Button>
      </div>
      </section>

      {activeView === "Day" && (
        <section className="progress-card">
        <div className="progress-top">
        <div>
        <div className="card-label">DAILY PROGRESS</div>
        <div className="progress-copy">
        <strong>{completed}</strong> of {selectedDayEntries.length} entries complete
        </div>
        </div>
        <div className="progress-percent">{percent}%</div>
        </div>
        <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        </section>
      )}

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
          {activeView === "All" && <small style={{ fontWeight: "bold" }}>{entry.date}</small>}
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
    ) : activeView === "Week" ? (
      <WeekView
      entries={entries}
      weekOffset={selectedWeekOffset}
      onWeekOffsetChange={setSelectedWeekOffset}
      onSelectDate={(date) => { setSelectedDate(date); setActiveView("Day"); }}
      onExportJson={exportJson}
      onExportIcs={exportIcs}
      />
    ) : (
      <MonthCalendarView
      entries={entries}
      monthDate={calendarMonth}
      onMonthChange={setCalendarMonth}
      onSelectDate={(date) => { setSelectedDate(date); setActiveView("Day"); }}
      onNewTask={(date) => openNew(date)}
      />
    )}
    </main>

    <nav className="mobile-nav" aria-label="Mobile navigation">
    <Button variant={activeView === "Day" ? "mobile-active" : "mobile"} icon="sun" onClick={() => setActiveView("Day")}>Day</Button>
    <Button variant={activeView === "Week" ? "mobile-active" : "mobile"} icon="calendar" onClick={() => setActiveView("Week")}>Week</Button>
    <Button variant="mobile-create" label="New entry" icon="plus" onClick={() => openNew(selectedDate)} />
    <Button variant={activeView === "Month" ? "mobile-active" : "mobile"} icon="calendar" onClick={() => setActiveView("Month")}>Calendar</Button>
    </nav>

    {editorOpen && (
      <EntryEditor
      entry={editing}
      defaultDate={selectedDate}
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
  weekOffset,
  onWeekOffsetChange,
  onSelectDate,
  onExportJson,
  onExportIcs,
}: {
  entries: Entry[];
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  onSelectDate: (dateStr: string) => void;
  onExportJson: () => void;
  onExportIcs: () => void;
}) {
  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const monday = useMemo(() => getStartOfWeek(baseDate), [baseDate]);

  const weekDays = useMemo(() => {
    const days = [];
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const todayStr = getTodayString();
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
                isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [entries, monday]);

  const totalWeekly = useMemo(() => weekDays.reduce((acc, d) => acc + d.total, 0), [weekDays]);
  const completedWeekly = useMemo(() => weekDays.reduce((acc, d) => acc + d.completed, 0), [weekDays]);
  const weeklyPercent = totalWeekly ? Math.round((completedWeekly / totalWeekly) * 100) : 0;
  const maxDailyTasks = useMemo(() => Math.max(...weekDays.map((d) => d.total), 1), [weekDays]);

  const sunday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + 6);
    return d;
  }, [monday]);

  const rangeLabel = `${monday.getDate()} ${monday.toLocaleDateString("en-US", { month: "short" })} – ${sunday.getDate()} ${sunday.toLocaleDateString("en-US", { month: "short" })} ${sunday.getFullYear()}`;

  return (
    <>
    <section className="page-heading">
    <div>
    <div className="eyebrow">WEEKLY OVERVIEW</div>
    <div className="page-title">{rangeLabel}</div>
    <div className="page-subtitle">Tasks scheduled for this week.</div>
    </div>
    <div className="export-actions" style={{ display: "flex", gap: "8px" }}>
    <Button variant="secondary" onClick={() => onWeekOffsetChange(weekOffset - 1)}>← Prev Week</Button>
    <Button variant="secondary" onClick={() => onWeekOffsetChange(0)}>This Week</Button>
    <Button variant="secondary" onClick={() => onWeekOffsetChange(weekOffset + 1)}>Next Week →</Button>
    <Button variant="secondary" icon="download" onClick={onExportJson}>JSON</Button>
    <Button variant="primary" icon="calendar" onClick={onExportIcs}>.ics</Button>
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
      <div
      className="day-column"
      key={day.fullDateStr}
      style={{ cursor: "pointer" }}
      onClick={() => onSelectDate(day.fullDateStr)}
      >
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
    </>
  );
}

function MonthCalendarView({
  entries,
  monthDate,
  onMonthChange,
  onSelectDate,
  onNewTask,
}: {
  entries: Entry[];
  monthDate: Date;
  onMonthChange: (d: Date) => void;
  onSelectDate: (dateStr: string) => void;
  onNewTask: (dateStr: string) => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();

  const todayStr = getTodayString();

  const monthLabel = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const changeMonth = (offset: number) => {
    onMonthChange(new Date(year, month + offset, 1));
  };

  const calendarGrid = useMemo(() => {
    const grid = [];
    // Blank days before start
    for (let i = 0; i < startingDayOfWeek; i++) {
      grid.push(null);
    }
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = getTodayString(dateObj);
      const dayTasks = entries.filter((e) => e.date === dateStr);
      grid.push({
        dayNum: d,
        dateStr,
        tasks: dayTasks,
        isToday: dateStr === todayStr,
      });
    }
    return grid;
  }, [year, month, startingDayOfWeek, daysInMonth, entries, todayStr]);

  return (
    <>
    <section className="page-heading">
    <div>
    <div className="eyebrow">MONTHLY CALENDAR</div>
    <div className="page-title">{monthLabel}</div>
    <div className="page-subtitle">Navigate through months to inspect planned activities.</div>
    </div>
    <div style={{ display: "flex", gap: "8px" }}>
    <Button variant="secondary" onClick={() => changeMonth(-1)}>← Prev Month</Button>
    <Button variant="secondary" onClick={() => onMonthChange(new Date())}>Current Month</Button>
    <Button variant="secondary" onClick={() => changeMonth(1)}>Next Month →</Button>
    </div>
    </section>

    <section style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginTop: "16px" }}>
    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
      <div key={dayName} style={{ fontWeight: "bold", textAlign: "center", padding: "8px", opacity: 0.7 }}>
      {dayName}
      </div>
    ))}

    {calendarGrid.map((cell, index) =>
      cell ? (
        <div
        key={cell.dateStr}
        style={{
          border: "1px solid var(--border-color, #334155)",
              borderRadius: "8px",
              padding: "8px",
              minHeight: "85px",
              backgroundColor: cell.isToday ? "rgba(59, 130, 246, 0.1)" : "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
        }}
        onClick={() => onSelectDate(cell.dateStr)}
        >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ color: cell.isToday ? "#3b82f6" : "inherit" }}>{cell.dayNum}</strong>
        <Button
        variant="icon"
        icon="plus"
        label="Add task"
        onClick={(e) => {
          e.stopPropagation();
          onNewTask(cell.dateStr);
        }}
        />
        </div>
        <div>
        {cell.tasks.length > 0 && (
          <div style={{ fontSize: "11px", marginTop: "4px" }}>
          <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{cell.tasks.length} task(s)</span>
          </div>
        )}
        </div>
        </div>
      ) : (
        <div key={`empty-${index}`} style={{ padding: "8px" }} />
      )
    )}
    </section>
    </>
  );
}

function EntryEditor({
  entry,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}: {
  entry: Entry | null;
  defaultDate: string;
  onClose: () => void;
  onSave: (entry: Entry) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Entry>(
    entry ?? {
      id: Date.now(),
                                          title: "",
                                          date: defaultDate,
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
