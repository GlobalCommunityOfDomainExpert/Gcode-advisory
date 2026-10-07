"use client";

import { ReactNode, useState } from "react";
import { Button, Input, RemoveIconButton, Select, SectionLabel, Textarea } from "@/components/atoms";
import type { LucideIcon } from "lucide-react";
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

export function SelectField({ id, label, value, options, onChange, placeholder = "Select…" }: { id: string; label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <FormField label={label} htmlFor={id}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
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
  const options = [...SKILL_SUGGESTIONS, ...skills.filter((s) => !SKILL_SUGGESTIONS.includes(s))];
  const toggle = (s: string) => onChange(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s]);
  const add = () => {
    const v = draft.trim().slice(0, 40);
    if (v && !skills.some((s) => s.toLowerCase() === v.toLowerCase()) && skills.length < 30) onChange([...skills, v]);
    setDraft("");
  };
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
        <div className="flex-1">
          <Input
            size="sm"
            aria-label="Add another skill or tool"
            placeholder="Add another skill or tool"
            value={draft}
            maxLength={40}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
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
