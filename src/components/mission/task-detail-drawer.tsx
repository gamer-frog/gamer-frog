"use client";

import { useEffect, useState } from "react";
import {
  Bug,
  Calendar,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  User,
  X,
} from "lucide-react";
import type { TaskWithRelations } from "@/lib/types";
import { PRIORITY_META, TASK_STATUS_META } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskDetailDrawerProps {
  task: TaskWithRelations | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  agents: { id: string; name: string; avatar_emoji: string; slug: string }[];
}

const STATUSES: Array<{ value: TaskWithRelations["status"]; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  onUpdated,
  agents,
}: TaskDetailDrawerProps) {
  const [feedback, setFeedback] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [newPriority, setNewPriority] = useState<string | null>(null);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFeedback(task?.human_feedback ?? "");
    setNewStatus(null);
    setNewPriority(null);
    setNewAgentId(null);
  }, [task?.id]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !task) return null;

  const statusMeta = TASK_STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];

  const save = async () => {
    if (!task) return;
    setSaving(true);
    const patch: Record<string, unknown> = {};
    if (newStatus) patch.status = newStatus;
    if (newPriority) patch.priority = Number(newPriority);
    if (newAgentId !== null) patch.assigned_agent_id = newAgentId || null;
    if (feedback !== (task.human_feedback ?? "")) patch.human_feedback = feedback;

    if (Object.keys(patch).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const r = await fetch(`/api/mission/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error("Update failed");
      toast.success("Tarea actualizada");
      onUpdated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] z-50 bg-sidebar border-l border-sidebar-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-sidebar-border">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="text-[10px] font-pixel"
                style={{
                  color: statusMeta.color,
                  borderColor: `${statusMeta.color}55`,
                  background: statusMeta.bg,
                }}
              >
                {statusMeta.icon} {statusMeta.label}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-pixel"
                style={{
                  color: priorityMeta.color,
                  borderColor: `${priorityMeta.color}55`,
                }}
              >
                P{task.priority} · {priorityMeta.label}
              </Badge>
              {task.department && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-pixel"
                  style={{
                    color: task.department.color ?? "#fff",
                    borderColor: `${task.department.color ?? "#fff"}55`,
                  }}
                >
                  {task.department.icon} {task.department.name}
                </Badge>
              )}
            </div>
            <h2 className="text-base font-semibold text-foreground leading-snug">
              {task.title}
            </h2>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              #{task.id.slice(0, 8)} · created {relativeTime(task.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Descripción */}
          {task.description && (
            <section>
              <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2">
                Descripción
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </section>
          )}

          {/* Agente asignado */}
          <section>
            <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Agente asignado
            </h3>
            {task.assigned_agent ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">{task.assigned_agent.avatar_emoji}</span>
                <span className="font-medium">{task.assigned_agent.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {task.assigned_agent.slug}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin asignar</p>
            )}
          </section>

          {/* Tiempos */}
          <section className="grid grid-cols-2 gap-3 text-xs">
            <div className="glass rounded-md p-2.5">
              <div className="text-muted-foreground text-[10px] uppercase flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Started
              </div>
              <div className="font-mono">
                {task.started_at ? relativeTime(task.started_at) : "—"}
              </div>
            </div>
            <div className="glass rounded-md p-2.5">
              <div className="text-muted-foreground text-[10px] uppercase flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" /> Due
              </div>
              <div className="font-mono">
                {task.due_date ? relativeTime(task.due_date) : "—"}
              </div>
            </div>
          </section>

          {/* Edición inline */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Bug className="w-3 h-3" /> Acciones rápidas
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={newStatus ?? task.status}
                onValueChange={setNewStatus}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-sm">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Prioridad</Label>
              <Select
                value={newPriority ?? String(task.priority)}
                onValueChange={setNewPriority}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-sm">P1 — Critical</SelectItem>
                  <SelectItem value="2" className="text-sm">P2 — High</SelectItem>
                  <SelectItem value="3" className="text-sm">P3 — Normal</SelectItem>
                  <SelectItem value="4" className="text-sm">P4 — Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Reasignar a</Label>
              <Select
                value={newAgentId ?? task.assigned_agent_id ?? "__none__"}
                onValueChange={(v) => setNewAgentId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-sm">
                    Sin asignar
                  </SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-sm">
                      {a.avatar_emoji} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Feedback humano */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Feedback humano
            </h3>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Dejá notas para el agente o para futura revisión…"
              rows={4}
              className="text-sm resize-none"
            />
          </section>

          {/* Output payload si existe */}
          {task.output_payload && Object.keys(task.output_payload).length > 0 && (
            <section>
              <h3 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-2">
                Output payload
              </h3>
              <pre
                className={cn(
                  "text-[11px] font-mono glass rounded-md p-3 overflow-x-auto",
                  "text-foreground/80"
                )}
              >
                {JSON.stringify(task.output_payload, null, 2)}
              </pre>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Send className="w-3.5 h-3.5 mr-1" />
            )}
            Guardar cambios
          </Button>
        </div>
      </aside>
    </>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}
