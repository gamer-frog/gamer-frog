"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Agent, Department, TaskPriority } from "@/lib/types";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
  departments: Department[];
  agents: Agent[];
  defaultDepartmentId?: string | null;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreated,
  departments,
  agents,
  defaultDepartmentId,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(defaultDepartmentId ?? "__none__");
  const [agentId, setAgentId] = useState<string>("__none__");
  const [priority, setPriority] = useState<string>("3");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setDepartmentId(defaultDepartmentId ?? "__none__");
      setAgentId("__none__");
      setPriority("3");
    }
  }, [open, defaultDepartmentId]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/mission/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          department_id: departmentId === "__none__" ? null : departmentId,
          assigned_agent_id: agentId === "__none__" ? null : agentId,
          priority: Number(priority) as TaskPriority,
          source: "manual",
        }),
      });
      if (!r.ok) throw new Error("Create failed");
      toast.success("Tarea creada");
      onCreated();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-popover border-sidebar-border">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Nueva tarea
          </DialogTitle>
          <DialogDescription>
            Crear una tarea manualmente. Queda en estado pending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs">Título *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Refactor del módulo X"
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs">Descripción</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexto, objetivos, criterios de aceptación…"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Departamento</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-sm">—</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-sm">
                      {d.icon} {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Agente</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-sm">—</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-sm">
                      {a.avatar_emoji} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-sm">P1</SelectItem>
                  <SelectItem value="2" className="text-sm">P2</SelectItem>
                  <SelectItem value="3" className="text-sm">P3</SelectItem>
                  <SelectItem value="4" className="text-sm">P4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Plus className="w-3.5 h-3.5 mr-1" />
            )}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
