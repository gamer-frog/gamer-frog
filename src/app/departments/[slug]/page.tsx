import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { listDepartments, listAgentsWithPresence, listTasksWithRelations } from "@/lib/data";
import { AgentCard } from "@/components/mission/agent-card";
import { TaskCard } from "@/components/mission/task-card";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const depts = await listDepartments();
  return depts.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const depts = await listDepartments();
  const dept = depts.find((d) => d.slug === slug);
  return { title: dept ? `${dept.name} — Botardo OS` : "Botardo OS" };
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const depts = await listDepartments();
  const dept = depts.find((d) => d.slug === slug);
  if (!dept) notFound();

  const [allAgents, allTasks] = await Promise.all([
    listAgentsWithPresence(),
    listTasksWithRelations(),
  ]);
  const agents = allAgents.filter((a) => a.department_id === dept.id);
  const tasks = allTasks.filter((t) => t.department_id === dept.id);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span style={{ color: dept.color ?? "#fff" }} className="text-2xl">
            {dept.icon}
          </span>
          <div>
            <h1 className="font-pixel text-sm text-foreground">{dept.name}</h1>
            <p className="text-xs text-muted-foreground">{dept.description}</p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground font-mono">
            {tasks.length} tareas · {agents.length} agentes
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section>
          <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-3">
            Agents
          </h2>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin agentes en este departamento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {agents.map((a) => (
                <AgentCard key={a.id} agent={a} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-[10px] font-pixel uppercase tracking-wider text-muted-foreground mb-3">
            Tareas
          </h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin tareas en este departamento.</p>
          ) : (
            <div className="space-y-1.5">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
