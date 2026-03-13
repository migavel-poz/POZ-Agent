"use client";

import { useState } from "react";
import {
  SERVICE_CATALOG,
  getCatalogStats,
  getAreaStats,
  type ServiceStatus,
  type Priority,
  type FunctionArea,
  type Agent,
  type Skill,
} from "@/lib/catalog-data";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  PLANNED: {
    label: "Planned",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  EXISTS: {
    label: "Exists",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
  MISSING: {
    label: "Missing",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  PARTIAL: {
    label: "Partial",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  HIGH: {
    label: "High",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-950",
  },
  LOW: {
    label: "Low",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
  },
};

function StatusBadge({ status }: { status: ServiceStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bg
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      <span className={config.color}>{config.label}</span>
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  if (!priority) return null;
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        config.bg,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}

function ProgressBar({
  planned,
  exists,
  missing,
  partial,
  total,
}: {
  planned: number;
  exists: number;
  missing: number;
  partial: number;
  total: number;
}) {
  return (
    <div className="w-full">
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {exists > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${(exists / total) * 100}%` }}
          />
        )}
        {partial > 0 && (
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${(partial / total) * 100}%` }}
          />
        )}
        {planned > 0 && (
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${(planned / total) * 100}%` }}
          />
        )}
        {missing > 0 && (
          <div
            className="bg-red-300 transition-all"
            style={{ width: `${(missing / total) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
    </div>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 px-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{skill.name}</p>
        <div className="flex items-center gap-2 mt-1">
          {skill.agentMapping && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {skill.agentMapping}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{skill.notes}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={skill.priority} />
        <StatusBadge status={skill.status} />
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  isExpanded,
  onToggle,
}: {
  agent: Agent;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const stats = {
    total: agent.skills.length,
    planned: agent.skills.filter((s) => s.status === "PLANNED").length,
    exists: agent.skills.filter((s) => s.status === "EXISTS").length,
    missing: agent.skills.filter((s) => s.status === "MISSING").length,
    partial: agent.skills.filter((s) => s.status === "PARTIAL").length,
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "transition-transform shrink-0",
                  isExpanded && "rotate-90"
                )}
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              <h3 className="font-semibold text-sm">{agent.name}</h3>
            </div>
            <div className="flex items-center gap-3 mt-2 ml-6">
              <span className="text-xs text-muted-foreground">
                {stats.total} skills
              </span>
              <div className="flex items-center gap-1.5">
                {stats.exists > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {stats.exists} exist
                  </span>
                )}
                {stats.planned > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {stats.planned} planned
                  </span>
                )}
                {stats.missing > 0 && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {stats.missing} missing
                  </span>
                )}
                {stats.partial > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {stats.partial} partial
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="w-32 pt-1">
            <ProgressBar
              planned={stats.planned}
              exists={stats.exists}
              missing={stats.missing}
              partial={stats.partial}
              total={stats.total}
            />
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t">
          {agent.skills.map((skill, idx) => (
            <SkillRow key={idx} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}

function FunctionAreaSection({
  area,
  expandedAgents,
  toggleAgent,
  statusFilter,
  priorityFilter,
  searchQuery,
}: {
  area: FunctionArea;
  expandedAgents: Set<string>;
  toggleAgent: (key: string) => void;
  statusFilter: ServiceStatus | "ALL";
  priorityFilter: Priority | "ALL";
  searchQuery: string;
}) {
  const areaStats = getAreaStats(area);

  // Filter agents and their skills
  const filteredAgents = area.agents
    .map((agent) => {
      const filteredSkills = agent.skills.filter((skill) => {
        const matchesStatus =
          statusFilter === "ALL" || skill.status === statusFilter;
        const matchesPriority =
          priorityFilter === "ALL" || skill.priority === priorityFilter;
        const matchesSearch =
          !searchQuery ||
          skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          skill.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesPriority && matchesSearch;
      });
      return { ...agent, skills: filteredSkills };
    })
    .filter((agent) => agent.skills.length > 0);

  if (filteredAgents.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{area.name}</h2>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground">
              {area.agents.length} agents, {areaStats.totalSkills} skills
            </span>
            <ProgressBar
              planned={areaStats.planned}
              exists={areaStats.exists}
              missing={areaStats.missing}
              partial={areaStats.partial}
              total={areaStats.totalSkills}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {filteredAgents.map((agent, idx) => {
          const key = `${area.id}-${idx}`;
          return (
            <AgentCard
              key={key}
              agent={agent}
              isExpanded={expandedAgents.has(key)}
              onToggle={() => toggleAgent(key)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "ALL">(
    "ALL"
  );
  const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  const stats = getCatalogStats();

  const toggleAgent = (key: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    SERVICE_CATALOG.forEach((area, areaIdx) => {
      if (activeTab !== "all" && area.id !== activeTab) return;
      area.agents.forEach((_, agentIdx) => {
        all.add(`${area.id}-${agentIdx}`);
      });
    });
    setExpandedAgents(all);
  };

  const collapseAll = () => {
    setExpandedAgents(new Set());
  };

  const visibleAreas =
    activeTab === "all"
      ? SERVICE_CATALOG
      : SERVICE_CATALOG.filter((a) => a.id === activeTab);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Service & Agent Catalog
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete gap analysis across all function areas, agents, and skills
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <StatCard
          label="Function Areas"
          value={stats.totalFunctions}
          color="text-foreground"
        />
        <StatCard
          label="Total Agents"
          value={stats.totalAgents}
          color="text-foreground"
        />
        <StatCard
          label="Total Skills"
          value={stats.totalSkills}
          color="text-foreground"
        />
        <StatCard
          label="Planned"
          value={stats.planned}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Exists"
          value={stats.exists}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Missing"
          value={stats.missing}
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          label="High Priority"
          value={stats.highPriority}
          color="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Overall Progress */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Overall Catalog Progress</h3>
          <span className="text-sm text-muted-foreground">
            {stats.exists + stats.partial} of {stats.totalSkills} ready (
            {Math.round(
              ((stats.exists + stats.partial) / stats.totalSkills) * 100
            )}
            %)
          </span>
        </div>
        <ProgressBar
          planned={stats.planned}
          exists={stats.exists}
          missing={stats.missing}
          partial={stats.partial}
          total={stats.totalSkills}
        />
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Exists</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <span className="text-xs text-muted-foreground">Missing</span>
          </div>
        </div>
      </div>

      {/* Function Area Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            activeTab === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          All Areas
        </button>
        {SERVICE_CATALOG.map((area) => (
          <button
            key={area.id}
            onClick={() => setActiveTab(area.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === area.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {area.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search skills, agents, or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] max-w-md px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ServiceStatus | "ALL")
          }
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="ALL">All Statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="EXISTS">Exists</option>
          <option value="MISSING">Missing</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <select
          value={priorityFilter ?? "ALL"}
          onChange={(e) =>
            setPriorityFilter(
              e.target.value === "ALL"
                ? "ALL"
                : (e.target.value as Priority)
            )
          }
          className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-xs font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-xs font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Catalog Content */}
      <div className="space-y-8">
        {visibleAreas.map((area) => (
          <FunctionAreaSection
            key={area.id}
            area={area}
            expandedAgents={expandedAgents}
            toggleAgent={toggleAgent}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* Agent Mapping Summary Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Agent Mapping Summary</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            All planned agents with their skill counts and priority breakdown
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left py-2.5 px-4 font-medium">
                  Agent ID
                </th>
                <th className="text-left py-2.5 px-4 font-medium">
                  Agent Name
                </th>
                <th className="text-left py-2.5 px-4 font-medium">
                  Function Area
                </th>
                <th className="text-center py-2.5 px-4 font-medium">
                  Skills
                </th>
                <th className="text-center py-2.5 px-4 font-medium">
                  High
                </th>
                <th className="text-center py-2.5 px-4 font-medium">
                  Medium
                </th>
                <th className="text-center py-2.5 px-4 font-medium">
                  Low
                </th>
              </tr>
            </thead>
            <tbody>
              {SERVICE_CATALOG.flatMap((area) =>
                area.agents
                  .filter((agent) =>
                    agent.skills.some(
                      (s) => s.agentMapping && s.status === "PLANNED"
                    )
                  )
                  .map((agent, idx) => {
                    const plannedSkills = agent.skills.filter(
                      (s) => s.status === "PLANNED"
                    );
                    const agentId =
                      plannedSkills[0]?.agentMapping ?? "—";
                    return (
                      <tr
                        key={`${area.id}-${idx}`}
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="py-2 px-4">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                            {agentId}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-medium">
                          {agent.name}
                        </td>
                        <td className="py-2 px-4 text-muted-foreground">
                          {area.name}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {plannedSkills.length}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {
                              plannedSkills.filter(
                                (s) => s.priority === "HIGH"
                              ).length
                            }
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center">
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                            {
                              plannedSkills.filter(
                                (s) => s.priority === "MEDIUM"
                              ).length
                            }
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center">
                          <span className="text-gray-500 font-medium">
                            {
                              plannedSkills.filter(
                                (s) => s.priority === "LOW"
                              ).length
                            }
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
