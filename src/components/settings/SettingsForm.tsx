"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Target,
  Ruler,
  Save,
  Lock,
  Download,
  Upload,
  Check,
  Palette,
} from "lucide-react";
import { updateSettings, changePassword, exportData, importData } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Props {
  user: {
    name: string;
    age: number;
    heightCm: number;
    startWeight: number;
    currentWeight: number;
    goalWeight: number;
    unit: string;
    theme: string;
  };
}

export function SettingsForm({ user }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(String(user.age));
  const [height, setHeight] = useState(String(user.heightCm));
  const [current, setCurrent] = useState(String(user.currentWeight));
  const [goal, setGoal] = useState(String(user.goalWeight));
  const [unit, setUnit] = useState(user.unit);
  const [theme, setTheme] = useState(user.theme);
  const [savedProfile, setSavedProfile] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function saveProfile() {
    start(async () => {
      await updateSettings({
        name,
        age: parseInt(age, 10) || undefined,
        heightCm: parseInt(height, 10) || undefined,
        currentWeight: parseFloat(current.replace(",", ".")) || undefined,
        goalWeight: parseFloat(goal.replace(",", ".")) || undefined,
        unit,
        theme,
      });
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2000);
      router.refresh();
    });
  }

  function doChangePassword() {
    setPassMsg(null);
    start(async () => {
      const res = await changePassword(curPass, newPass);
      if (res.ok) {
        setPassMsg({ ok: true, text: "Пароль изменён" });
        setCurPass("");
        setNewPass("");
      } else {
        setPassMsg({ ok: false, text: res.error ?? "Ошибка" });
      }
    });
  }

  function doExport() {
    start(async () => {
      const json = await exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitjourney-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      start(async () => {
        const res = await importData(text);
        setImportMsg(res.ok ? "Данные импортированы ✓" : res.error ?? "Ошибка импорта");
        if (res.ok) router.refresh();
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      {/* Профиль */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          <User size={14} /> Профиль
        </h2>
        <Card className="space-y-3">
          <Field label="Имя">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Возраст">
              <input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="input-field" />
            </Field>
            <Field label="Рост (см)">
              <input inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} className="input-field" />
            </Field>
          </div>
        </Card>
      </div>

      {/* Вес и цель */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          <Target size={14} /> Вес и цель
        </h2>
        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Текущий (кг)">
              <input inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} className="input-field" />
            </Field>
            <Field label="Цель (кг)">
              <input inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)} className="input-field" />
            </Field>
          </div>
          <Field label="Единицы измерения">
            <div className="flex gap-2">
              {["kg", "lb"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={cn(
                    "flex-1 rounded-2xl border py-3 text-sm font-medium transition-all active:scale-95",
                    unit === u
                      ? "border-accent/40 bg-accent/20 text-accent-soft"
                      : "border-white/10 bg-white/[0.03] text-white/50",
                  )}
                >
                  {u === "kg" ? "Килограммы" : "Фунты"}
                </button>
              ))}
            </div>
          </Field>
        </Card>
      </div>

      {/* Тема */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          <Palette size={14} /> Тема оформления
        </h2>
        <Card>
          <div className="flex gap-2">
            {[
              { v: "dark", l: "Тёмная" },
              { v: "light", l: "Светлая" },
              { v: "system", l: "Системная" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setTheme(t.v)}
                className={cn(
                  "flex-1 rounded-2xl border py-3 text-sm font-medium transition-all active:scale-95",
                  theme === t.v
                    ? "border-accent/40 bg-accent/20 text-accent-soft"
                    : "border-white/10 bg-white/[0.03] text-white/50",
                )}
              >
                {t.l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/35">
            Приложение оптимизировано под тёмную тему.
          </p>
        </Card>
      </div>

      <button onClick={saveProfile} disabled={pending} className="btn-primary w-full">
        {savedProfile ? <><Check size={18} /> Сохранено</> : <><Save size={18} /> Сохранить изменения</>}
      </button>

      {/* Пароль */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          <Lock size={14} /> Смена пароля
        </h2>
        <Card className="space-y-3">
          <Field label="Текущий пароль">
            <input type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} className="input-field" autoComplete="current-password" />
          </Field>
          <Field label="Новый пароль">
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="input-field" autoComplete="new-password" />
          </Field>
          {passMsg && (
            <p className={cn("text-sm", passMsg.ok ? "text-emerald-400" : "text-red-400")}>{passMsg.text}</p>
          )}
          <button onClick={doChangePassword} disabled={pending || !curPass || !newPass} className="btn-ghost w-full">
            Изменить пароль
          </button>
        </Card>
      </div>

      {/* Данные */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          <Download size={14} /> Резервная копия
        </h2>
        <Card className="space-y-3">
          <button onClick={doExport} disabled={pending} className="btn-ghost w-full">
            <Download size={18} /> Экспорт данных (JSON)
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={pending} className="btn-ghost w-full">
            <Upload size={18} /> Импорт данных
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImportFile} className="hidden" />
          {importMsg && <p className="text-sm text-white/60">{importMsg}</p>}
          <p className="text-xs text-white/35">
            Экспорт сохраняет вес, историю и настройки. Импорт заменит текущие данные веса и настройки.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-muted mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
