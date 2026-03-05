import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/* ── Year Picker overlay ────────────────────────────────────────────────── */
const YearPicker = ({ displayMonth, fromDate, toDate, onSelect }) => {
  const startYear = fromDate ? fromDate.getFullYear() : new Date().getFullYear() - 10;
  const endYear   = toDate   ? toDate.getFullYear()   : new Date().getFullYear() + 10;
  const currentYear = displayMonth.getFullYear();

  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current?.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        padding: '8px 6px',
        maxHeight: 220,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4,
      }}
    >
      {years.map(y => {
        const active = y === currentYear;
        return (
          <button
            key={y}
            data-selected={active}
            onClick={() => {
              const d = new Date(displayMonth);
              d.setFullYear(y);
              onSelect(d);
            }}
            style={{
              padding: '7px 4px',
              borderRadius: 8,
              border: active ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              background: active ? 'hsl(var(--primary))' : 'transparent',
              color: active ? 'hsl(var(--primary-foreground))' : 'inherit',
              fontWeight: active ? 700 : 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              minHeight: 0,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'hsl(var(--accent))'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
};

/* ── Custom Caption with clickable Month/Year label ─────────────────────── */
const Caption = ({ displayMonth, fromDate, toDate, onMonthChange }) => {
  const [showYearPicker, setShowYearPicker] = React.useState(false);

  const prevMonth = () => {
    const d = new Date(displayMonth);
    d.setMonth(d.getMonth() - 1);
    onMonthChange(d);
  };

  const nextMonth = () => {
    const d = new Date(displayMonth);
    d.setMonth(d.getMonth() + 1);
    onMonthChange(d);
  };

  const handleYearSelect = (date) => {
    onMonthChange(date);
    setShowYearPicker(false);
  };

  const label = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingTop: 4,
        marginBottom: showYearPicker ? 6 : 0,
        width: '100%',
      }}>
        {!showYearPicker && (
          <button
            onClick={prevMonth}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1'
            )}
            style={{ minHeight: 0 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => setShowYearPicker(v => !v)}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'inherit',
            minHeight: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          title="Click to pick a year"
        >
          {label}
          <span style={{
            fontSize: '0.6rem',
            opacity: 0.5,
            transform: showYearPicker ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>▼</span>
        </button>

        {!showYearPicker && (
          <button
            onClick={nextMonth}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1'
            )}
            style={{ minHeight: 0 }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {showYearPicker && (
        <YearPicker
          displayMonth={displayMonth}
          fromDate={fromDate}
          toDate={toDate}
          onSelect={handleYearSelect}
        />
      )}
    </div>
  );
};

/* ── Calendar ───────────────────────────────────────────────────────────── */
function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  const [month, setMonth] = React.useState(props.defaultMonth || props.selected || new Date());

  React.useEffect(() => {
    if (props.defaultMonth) setMonth(props.defaultMonth);
  }, [props.defaultMonth]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      month={month}
      onMonthChange={setMonth}
      className={cn("p-3 w-full", className)}
      classNames={{
        months: "flex flex-col w-full",
        month: "w-full",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "hidden",
        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 w-full",
        head_cell: "text-muted-foreground font-normal text-[0.8rem] text-center py-2",
        row: "grid grid-cols-7 w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex items-center justify-center [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 font-normal aria-selected:opacity-100 mx-auto"),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: ({ displayMonth }) => (
          <Caption
            displayMonth={displayMonth}
            fromDate={props.fromDate}
            toDate={props.toDate}
            onMonthChange={setMonth}
          />
        ),
        /* Red "Su" header */
        HeadCell: ({ children, ...hProps }) => {
          const days = ['Su', 'Sun', 'S'];
          const isSun = days.includes(String(children));
          return (
            <th
              {...hProps}
              className="font-normal text-[0.8rem] text-center py-2"
              style={{ color: isSun ? '#ef4444' : 'hsl(var(--muted-foreground))' }}
            >
              {children}
            </th>
          );
        },
        /* Red date numbers for Sundays */
        Day: ({ date, displayMonth, ...dayProps }) => {
          const isSunday = date.getDay() === 0;
          const isSelected = dayProps['aria-selected'];
          return (
            <button
              {...dayProps}
              style={{
                ...dayProps.style,
                color: isSunday && !isSelected ? '#ef4444' : undefined,
              }}
            />
          );
        },
        IconLeft: ({ className: cls, ...p }) => <ChevronLeft className={cn("h-4 w-4", cls)} {...p} />,
        IconRight: ({ className: cls, ...p }) => <ChevronRight className={cn("h-4 w-4", cls)} {...p} />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar"
export { Calendar }
