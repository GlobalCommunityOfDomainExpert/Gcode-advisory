"use client";

import { ReactNode, useEffect, useId, useState } from "react";
import { Button, Input, RemoveIconButton, SectionLabel, Textarea } from "@/components/atoms";
import { X, type LucideIcon } from "lucide-react";
import { Chip, FormField } from "@/components/molecules";
import { SKILL_SUGGESTIONS } from "@/lib/profile/options";

/* Small form building blocks shared by the profile tabs. They only render and report changes; the editor owns state. */

export function TextField({
  id,
  label,
  value,
  onChange,
  icon,
  hint,
  placeholder,
  type = "text",
  maxLength = 200,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: LucideIcon;
  hint?: string;
  placeholder?: string;
  type?: "text" | "url" | "email" | "tel" | "number";
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <Input id={id} type={type} icon={icon} value={value} placeholder={placeholder} maxLength={maxLength} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows = 4,
  max,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  max: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <Textarea id={id} rows={rows} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <p className="text-small text-text-secondary text-right tabular-nums">
        {value.length} / {max}
      </p>
    </FormField>
  );
}

/** Words in `name` that start with `q`, or `name` itself starting with it. Case-insensitive. */
const matchesTyped = (name: string, q: string) => {
  const n = name.toLowerCase();
  return n.startsWith(q) || n.split(/[\s/(),-]+/).some((w) => w.startsWith(q)) || n.includes(q);
};

/**
 * A pick list you can type into: type to narrow the list, then choose a row. Only listed values can be chosen, so the
 * result is always something the backend's pick-list table accepts. Replaces a plain <select> wherever a list is long
 * or comes from the taxonomy tables.
 */
export function SearchSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Select…",
  ariaLabel,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [query, setQuery] = useState<string | null>(null); // null = not typing: show the chosen value
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const q = (query ?? "").trim().toLowerCase();
  const rows = q
    ? options.filter((o) => matchesTyped(o, q)).sort((a, b) => Number(b.toLowerCase().startsWith(q)) - Number(a.toLowerCase().startsWith(q)))
    : options;
  const showList = open;

  const choose = (v: string) => {
    onChange(v);
    setQuery(null);
    setOpen(false);
    setActive(-1);
  };
  const close = () => {
    setQuery(null);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={query ?? value}
        className={value ? "pr-9" : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={(e) => {
          setOpen(true);
          e.currentTarget.select();
        }}
        onBlur={close}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            if (rows.length) setActive((i) => (i + 1) % rows.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (rows.length) setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
          } else if (e.key === "Enter") {
            // Enter never submits the tab; it picks the highlighted row (or the only match).
            e.preventDefault();
            const pick = rows[active] ?? (rows.length === 1 ? rows[0] : undefined);
            if (open && pick) choose(pick);
          } else if (e.key === "Escape") {
            close();
          }
        }}
      />
      {value && query === null && (
        <button
          type="button"
          aria-label="Clear selection"
          // mousedown so the input doesn't blur (and re-render) before the click lands
          onMouseDown={(e) => {
            e.preventDefault();
            choose("");
          }}
          className="text-text-secondary hover:text-text-primary absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
      {showList && (
        <ul id={listId} role="listbox" className="bg-surface-light border-border-light absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-sm border py-1 shadow-lg">
          {rows.length === 0 && <li className="text-small text-text-secondary px-3 py-2">No matches</li>}
          {rows.map((o, i) => (
            <li
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o === value}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={`text-small cursor-pointer px-3 py-2 ${i === active ? "bg-bg-light text-primary" : "text-text-primary"} ${o === value ? "font-semibold" : ""}`}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SelectField({ id, label, value, options, onChange, placeholder = "Select…" }: { id: string; label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <FormField label={label} htmlFor={id}>
      <SearchSelect id={id} value={value} options={options} onChange={onChange} placeholder={placeholder} />
    </FormField>
  );
}

export const Grid2 = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

export function ChipGroup({ id, label, hint, options, selected, onToggle }: { id: string; label: string; hint?: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <div id={id} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} selected={selected.includes(o)} onClick={() => onToggle(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </FormField>
  );
}

/** Suggested skills plus any the user adds. Custom skills are kept as chips too. */
export function SkillsField({ skills, onChange }: { skills: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [settled, setSettled] = useState(""); // the text the current `found` answers
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const options = [...SKILL_SUGGESTIONS, ...skills.filter((s) => !SKILL_SUGGESTIONS.includes(s))];
  const toggle = (s: string) => onChange(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s]);
  const has = (v: string) => skills.some((s) => s.toLowerCase() === v.toLowerCase());
  const commit = (value: string) => {
    const v = value.trim().slice(0, 40);
    if (v && !has(v) && skills.length < 30) onChange([...skills, v]);
    setDraft("");
    setFound([]);
    setSettled("");
    setOpen(false);
    setActive(-1);
  };

  // Suggestions come from the skills list in the database. If the lookup fails, fall back to the chips shown above.
  useEffect(() => {
    const q = draft.trim();
    if (!q) return; // nothing typed: rows below are derived from `q`, so stale results are never shown
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/skills?q=${encodeURIComponent(q)}`, { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok) throw new Error("lookup failed");
        const data = (await res.json()) as { skills?: string[] };
        setFound(data.skills ?? []);
        setSettled(q);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        const lower = q.toLowerCase();
        setFound(SKILL_SUGGESTIONS.filter((s) => s.toLowerCase().split(/\s+/).some((w) => w.startsWith(lower)) || s.toLowerCase().startsWith(lower)));
        setSettled(q);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [draft]);

  const q = draft.trim();
  const matches = q ? found.filter((s) => !has(s)) : [];
  // Wait for the lookup so "Add ..." doesn't flash up before the real suggestions arrive.
  const canAddTyped = settled === q && q.length > 0 && !has(q) && !found.some((s) => s.toLowerCase() === q.toLowerCase());
  // Rows: the matches, then "Add <typed text>" so a skill that is not on the list can still be added.
  const rows = [...matches.map((s) => ({ key: s, label: s, value: s, custom: false })), ...(canAddTyped ? [{ key: "__add", label: `Add “${q}”`, value: q, custom: true }] : [])];
  const showList = open && rows.length > 0;
  const add = () => commit(active >= 0 && rows[active] ? rows[active].value : draft);

  return (
    <FormField label="Skills & tools" htmlFor="skills" hint="Pick from suggestions or add your own.">
      <div id="skills" className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} selected={skills.includes(o)} onClick={() => toggle(o)}>
            {o}
          </Chip>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <Input
            size="sm"
            role="combobox"
            aria-label="Add another skill or tool"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            placeholder="Add another skill or tool"
            value={draft}
            maxLength={40}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              } else if (e.key === "ArrowDown" && rows.length) {
                e.preventDefault();
                setOpen(true);
                setActive((i) => (i + 1) % rows.length);
              } else if (e.key === "ArrowUp" && rows.length) {
                e.preventDefault();
                setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
              } else if (e.key === "Escape") {
                setOpen(false);
                setActive(-1);
              }
            }}
          />
          {showList && (
            <ul id={listId} role="listbox" aria-label="Skill suggestions" className="bg-surface-light border-border-light absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-sm border py-1 shadow-lg">
              {rows.map((r, i) => (
                <li
                  key={r.key}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  // mousedown (not click) so the input keeps focus and onBlur doesn't close the list first
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(r.value);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`text-small cursor-pointer px-3 py-2 ${i === active ? "bg-bg-light text-primary" : "text-text-primary"} ${r.custom ? "border-border-light border-t" : ""}`}
                >
                  {r.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => commit(draft)}>
          Add
        </Button>
      </div>
    </FormField>
  );
}

export interface ListFieldDef<T> {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  area?: boolean;
  wide?: boolean;
  type?: "text" | "url" | "email" | "tel";
  max?: number;
}

/** A repeatable group of fields (roles, education, projects, contacts). Always shows at least one row. */
export function ListEditor<T extends object>({
  name,
  entryTitle,
  rows,
  blank,
  fields,
  addLabel,
  onChange,
  max = 20,
}: {
  name: string;
  entryTitle: string;
  rows: T[];
  blank: T;
  fields: ListFieldDef<T>[];
  addLabel: string;
  onChange: (rows: T[]) => void;
  max?: number;
}) {
  const shown = rows.length ? rows : [blank];
  const set = (i: number, key: keyof T, value: string) => onChange(shown.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  return (
    <div className="space-y-3">
      {shown.map((row, i) => (
        <div key={i} className="border-border-light bg-bg-subtle rounded-md border p-4">
          <div className="flex items-center justify-between">
            <p className="text-body text-text-primary font-semibold">
              {entryTitle} {i + 1}
            </p>
            {shown.length > 1 && <RemoveIconButton ariaLabel={`Remove ${entryTitle.toLowerCase()} ${i + 1}`} onClick={() => onChange(shown.filter((_, j) => j !== i))} />}
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `${name}-${i}-${f.key}`;
              const value = String((row as Record<string, unknown>)[f.key] ?? "");
              return (
                <div key={f.key} className={f.wide ? "sm:col-span-2" : undefined}>
                  <FormField label={f.label} htmlFor={id}>
                    {f.area ? (
                      <Textarea id={id} rows={3} value={value} placeholder={f.placeholder} maxLength={f.max ?? 500} onChange={(e) => set(i, f.key, e.target.value)} />
                    ) : (
                      <Input id={id} type={f.type ?? "text"} value={value} placeholder={f.placeholder} maxLength={f.max ?? 150} onChange={(e) => set(i, f.key, e.target.value)} />
                    )}
                  </FormField>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {shown.length < max && (
        <Button type="button" variant="secondary" className="w-full" onClick={() => onChange([...shown, blank])}>
          + {addLabel}
        </Button>
      )}
    </div>
  );
}

export const GroupLabel = ({ children }: { children: ReactNode }) => <SectionLabel>{children}</SectionLabel>;
