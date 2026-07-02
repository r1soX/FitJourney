"use client";

import { useState, useTransition } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Plus, Trash2, TrendingDown, TrendingUp, Minus, X } from "lucide-react";
import { addWeightEntry, deleteWeightEntry } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface WeightPoint {
  dateLabel: string;
  actual: number | null;
  target: number;
}

export interface WeightRow {
  id: number;
  dateLabel: string;
  dateISO: string;
  weight: number;
  delta: number | null;
  note: string;
}

export function WeightManager({
  points,
  rows,
  goalWeight,
  unitLabel,
}: {
  points: WeightPoint[];
  rows: WeightRow[];
  goalWeight: number;
  unitLabel: string;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  function submit() {
    const w = parseFloat(weight.replace(",", "."));
    if (!w || w <= 0) return;
    start(async () => {
      await addWeightEntry({ weight: w, note, date });
      setOpen(false);
      setWeight("");
      setNote("");
    });
  }

  function remove(id: number) {
    start(async () => {
      await deleteWeightEntry(id);
    });
  }

  const weights = rows.map((r) => r.weight);
  const yMin = weights.length ? Math.floor(Math.min(...weights, goalWeight) - 2) : goalWeight - 2;
  const yMax = weights.length ? Math.ceil(Math.max(...weights) + 2) : 130;

  return (
    <div>
      {/* График */}
      <Card className="!p-3">
        <div className="mb-2 flex items-center justify-between px-2 pt-1">
          <span className="text-sm font-semibold text-white/70">Динамика веса</span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-accent-soft">
              <span className="h-2 w-2 rounded-full bg-accent" /> факт
            </span>
            <span className="flex items-center gap-1 text-white/40">
              <span className="h-0.5 w-3 bg-white/30" /> план
            </span>
          </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,18,24,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                formatter={(v: number, name: string) => [
                  `${v?.toFixed?.(1)} ${unitLabel}`,
                  name === "actual" ? "Факт" : "План",
                ]}
              />
              <ReferenceLine
                y={goalWeight}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: "цель", fill: "#10b981", fontSize: 10, position: "insideTopRight" }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#60a5fa", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Кнопка добавить */}
      <button onClick={() => setOpen(true)} className="btn-primary mt-4 w-full">
        <Plus size={18} /> Записать вес
      </button>

      {/* История веса */}
      <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wider text-white/50">
        История ({rows.length})
      </h2>
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-white/40">Пока нет записей веса</p>
        )}
        {rows
          .slice()
          .reverse()
          .map((r) => (
            <div key={r.id} className="glass flex items-center gap-3 p-3.5">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold tabular">
                    {r.weight.toFixed(1)} {unitLabel}
                  </span>
                  {r.delta !== null && r.delta !== 0 && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 text-xs font-medium",
                        r.delta < 0 ? "text-emerald-400" : "text-amber-400",
                      )}
                    >
                      {r.delta < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                      {r.delta > 0 ? "+" : ""}
                      {r.delta.toFixed(1)}
                    </span>
                  )}
                  {r.delta === 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-white/40">
                      <Minus size={13} /> 0
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {r.dateLabel}
                  {r.note && ` · ${r.note}`}
                </div>
              </div>
              <button
                onClick={() => remove(r.id)}
                disabled={pending}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 active:scale-90"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </div>

      {/* Модалка добавления */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-strong w-full max-w-md p-5 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Записать вес</h3>
              <button onClick={() => setOpen(false)} className="text-white/40">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label-muted mb-1.5 block">Вес ({unitLabel})</label>
                <input
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="напр. 124.5"
                  className="input-field text-center text-xl font-bold"
                  autoFocus
                />
              </div>
              <div>
                <label className="label-muted mb-1.5 block">Дата</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-muted mb-1.5 block">Заметка (необязательно)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="самочувствие, обстоятельства..."
                  className="input-field"
                />
              </div>
              <button onClick={submit} disabled={pending} className="btn-primary w-full">
                {pending ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
