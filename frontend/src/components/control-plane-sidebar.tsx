'use client';

import React, { useState } from 'react';
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  Clock,
  Command,
  Cpu,
  Database,
  Flame,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ActiveTab =
  | 'dashboard'
  | 'studio'
  | 'approvals'
  | 'console'
  | 'trace'
  | 'policies'
  | 'attack-lab'
  | 'evaluation'
  | 'audit';

interface ControlPlaneSidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  totalIntentsCount?: number;
  pendingApprovalsCount?: number;
  hasActiveTrace?: boolean;
  onOpenCommand: () => void;
}

type NavBadgeTone = 'default' | 'success' | 'warning';

interface NavItem {
  id: ActiveTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  badge?: {
    label: string;
    tone: NavBadgeTone;
  };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

type Environment = 'prod' | 'staging' | 'lab';

const environmentCopy: Record<Environment, { label: string; detail: string }> = {
  prod: { label: 'Production', detail: 'Live payment gate' },
  staging: { label: 'Staging', detail: 'Deterministic sandbox' },
  lab: { label: 'Adversarial lab', detail: 'Threat testbed' },
};

const badgeStyles: Record<NavBadgeTone, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export function ControlPlaneSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  totalIntentsCount,
  pendingApprovalsCount,
  hasActiveTrace,
  onOpenCommand,
}: ControlPlaneSidebarProps) {
  const [activeEnvironment, setActiveEnvironment] = useState<Environment>('prod');
  const environment = environmentCopy[activeEnvironment];

  const navSections: NavSection[] = [
    {
      title: 'Workspace',
      items: [
        {
          id: 'dashboard',
          label: 'Workbench',
          description: 'Financial stream and analytics',
          icon: LayoutDashboard,
          shortcut: '⌘3',
          badge: totalIntentsCount
            ? { label: String(totalIntentsCount), tone: 'default' }
            : undefined,
        },
        {
          id: 'studio',
          label: 'Agent Studio',
          description: 'Fleet and scoped tokens',
          icon: Bot,
          shortcut: '⌘1',
        },
        {
          id: 'approvals',
          label: 'Supervisor Queue',
          description: 'Two-person approval workflow',
          icon: Clock,
          shortcut: '⌘2',
          badge: pendingApprovalsCount
            ? { label: String(pendingApprovalsCount), tone: 'warning' }
            : undefined,
        },
        {
          id: 'console',
          label: 'Agent Simulator',
          description: 'Prompt execution testbed',
          icon: Zap,
          shortcut: '⌘4',
        },
      ],
    },
    {
      title: 'Safety controls',
      items: [
        {
          id: 'trace',
          label: 'Decision Trace',
          description: 'FSM pipeline trace inspector',
          icon: Search,
          shortcut: '⌘5',
          badge: hasActiveTrace ? { label: 'Live', tone: 'success' } : undefined,
        },
        {
          id: 'policies',
          label: 'Policy Matrix',
          description: 'Rules, caps, and merchant ACL',
          icon: Sliders,
          shortcut: '⌘6',
        },
      ],
    },
    {
      title: 'Assurance',
      items: [
        {
          id: 'attack-lab',
          label: 'Attack Lab',
          description: 'Adversarial threat vectors',
          icon: Flame,
          shortcut: '⌘7',
        },
        {
          id: 'evaluation',
          label: 'Safety Benchmarks',
          description: 'Release quality gate',
          icon: TrendingUp,
          shortcut: '⌘8',
        },
        {
          id: 'audit',
          label: 'Audit Ledger',
          description: 'Cryptographic event log',
          icon: Database,
          shortcut: '⌘9',
        },
      ],
    },
  ];

  const selectEnvironment = (nextEnvironment: Environment, message: string) => {
    setActiveEnvironment(nextEnvironment);
    toast[nextEnvironment === 'prod' ? 'success' : 'info'](message);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          'relative z-30 flex h-full shrink-0 select-none flex-col overflow-hidden border-r border-border/70 bg-card/95 shadow-[1px_0_0_hsl(var(--background)/0.5)] backdrop-blur-xl transition-[width] duration-200 ease-out',
          isCollapsed ? 'w-16' : 'w-[280px]'
        )}
      >
        <div className="flex h-[4.25rem] shrink-0 items-center border-b border-border/70 px-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label="Expand sidebar"
                  className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Shield className="size-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
                      <Shield className="size-4" />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
                        AgentPay
                      </span>
                      <span className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129_/_0.12)]" />
                        {environment.label} · {environment.detail}
                      </span>
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-1.5">
                  <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Control environment
                  </DropdownMenuLabel>
                  <DropdownMenuGroup className="space-y-0.5">
                    <DropdownMenuItem
                      onClick={() => selectEnvironment('prod', 'Active: Production Razorpay Live Gate')}
                      className="cursor-pointer gap-2.5 rounded-lg py-2"
                    >
                      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-medium">Production Gate</span>
                        <span className="block truncate text-[10px] text-muted-foreground">Razorpay live settlement</span>
                      </div>
                      {activeEnvironment === 'prod' && <Check className="size-4 shrink-0 text-emerald-500" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => selectEnvironment('staging', 'Active: Staging Deterministic Sandbox')}
                      className="cursor-pointer gap-2.5 rounded-lg py-2"
                    >
                      <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Cpu className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-medium">Staging Sandbox</span>
                        <span className="block truncate text-[10px] text-muted-foreground">Deterministic mock gate</span>
                      </div>
                      {activeEnvironment === 'staging' && <Check className="size-4 shrink-0 text-blue-500" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => selectEnvironment('lab', 'Active: Adversarial Threat Testbed')}
                      className="cursor-pointer gap-2.5 rounded-lg py-2"
                    >
                      <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Flame className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-medium">Adversarial Lab</span>
                        <span className="block truncate text-[10px] text-muted-foreground">Formal threat testbed</span>
                      </div>
                      {activeEnvironment === 'lab' && <Check className="size-4 shrink-0 text-rose-500" />}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    onClick={() => onSelectTab('policies')}
                    className="cursor-pointer gap-2 rounded-lg py-2 text-xs text-muted-foreground"
                  >
                    <Sliders className="size-3.5" />
                    Configure policy ceilings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="ml-1 size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronLeft className="size-4" />
                    <span className="sr-only">Collapse sidebar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Collapse sidebar <kbd className="ml-1 font-mono text-[10px]">⌘B</kbd></TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {!isCollapsed && (
          <div className="shrink-0 px-3 pb-2 pt-3">
            <button
              type="button"
              onClick={onOpenCommand}
              className="flex h-9 w-full items-center justify-between rounded-lg border border-border/70 bg-background px-2.5 text-left text-xs text-muted-foreground shadow-sm transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Command className="size-3.5 shrink-0" />
                <span className="truncate">Search commands</span>
              </span>
              <kbd className="rounded border border-border bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
            </button>
          </div>
        )}

        <nav aria-label="Control plane navigation" className={cn('min-h-0 flex-1 overflow-y-auto', isCollapsed ? 'px-2 py-3' : 'px-3 py-3')}>
          <div className={cn('space-y-5', isCollapsed && 'space-y-3')}>
            {navSections.map((section, sectionIndex) => (
              <section
                key={section.title}
                aria-labelledby={isCollapsed ? undefined : `sidebar-section-${sectionIndex}`}
              >
                {isCollapsed ? (
                  sectionIndex > 0 && <div className="mx-auto mb-3 h-px w-7 bg-border/80" />
                ) : (
                  <h2
                    id={`sidebar-section-${sectionIndex}`}
                    className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/75"
                  >
                    {section.title}
                  </h2>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const navButton = (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectTab(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={`${item.label} (${item.shortcut})`}
                        className={cn(
                          'group relative flex w-full items-center gap-2.5 rounded-xl text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isCollapsed ? 'mx-auto size-10 justify-center p-0' : 'min-h-10 px-2.5 py-1.5',
                          isActive
                            ? 'bg-foreground text-background shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                            isActive
                              ? 'bg-background/15 text-background'
                              : 'bg-muted/70 text-muted-foreground group-hover:bg-background group-hover:text-foreground dark:group-hover:bg-muted'
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  'inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                  isActive ? 'bg-background/15 text-background' : badgeStyles[item.badge.tone]
                                )}
                              >
                                {item.badge.label}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );

                    if (!isCollapsed) {
                      return navButton;
                    }

                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                        <TooltipContent side="right" className="max-w-52">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{item.label}</span>
                            <kbd className="ml-auto rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">{item.shortcut}</kbd>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <footer className="shrink-0 border-t border-border/70 bg-background/60 p-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">Safety gate operational</p>
                <p className="text-[11px] text-muted-foreground">Deterministic FSM · ~14 ms</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-foreground">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    Safety gate operational
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">~14 ms</span>
                </div>
                <p className="mt-1 pl-4 text-[10px] text-muted-foreground">Deterministic verification is active</p>
              </div>

              <div className="flex items-center gap-2 px-1">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-[10px] font-semibold text-background">SN</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">Staff Operator</p>
                  <p className="truncate text-[10px] text-muted-foreground">admin@agentpay.ai</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSelectTab('policies')}
                      aria-label="Open policy settings"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Settings className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Policy settings</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </footer>
      </aside>
    </TooltipProvider>
  );
}
