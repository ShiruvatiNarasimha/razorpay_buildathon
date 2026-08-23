'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Bot,
  Search,
  Sliders,
  Flame,
  TrendingUp,
  Database,
  Sun,
  Moon,
  Laptop,
  Clock,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { DecisionTraceDTO } from '@/types/contracts';
import { ApiClient, DashboardMetricsResponse } from '@/lib/api-client';
import { ControlPlaneHeader } from './control-plane-header';
import { ControlPlaneSidebar, ActiveTab } from './control-plane-sidebar';
import { DashboardView } from './dashboard/dashboard-view';
import { AgentStudioView } from './agent-studio/agent-studio-view';
import { SupervisorQueueView } from './supervisor/supervisor-queue-view';
import { AgentConsoleView } from './agent-console/agent-console-view';
import { DecisionTraceView } from './decision-trace/decision-trace-view';
import { PoliciesView } from './policies/policies-view';
import { AttackLabView } from './attack-lab/attack-lab-view';
import { EvaluationView } from './evaluation/evaluation-view';
import { AuditLedgerView } from './audit-ledger/audit-ledger-view';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator as CmdSeparator,
} from '@/components/ui/command';

export function ControlPlaneShell() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [selectedTrace, setSelectedTrace] = useState<DecisionTraceDTO | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    fetchInitialData();

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
        return;
      }

      // ⌘B or Ctrl+B to toggle sidebar collapse
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
        return;
      }

      // ⌘1 to ⌘9 for Quick Navigation
      if ((e.metaKey || e.ctrlKey) && !isNaN(Number(e.key))) {
        const keyNum = Number(e.key);
        const tabs: ActiveTab[] = [
          'studio',
          'approvals',
          'dashboard',
          'console',
          'trace',
          'policies',
          'attack-lab',
          'evaluation',
          'audit',
        ];
        if (keyNum >= 1 && keyNum <= tabs.length) {
          e.preventDefault();
          setActiveTab(tabs[keyNum - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    try {
      await ApiClient.checkHealth();
      setApiStatus('online');
      const metricsData = await ApiClient.getDashboardMetrics();
      setMetrics(metricsData);

      try {
        const approvals = await ApiClient.getPendingApprovals();
        setPendingApprovalsCount(approvals.total);
      } catch {
        // Fallback
      }
    } catch {
      setApiStatus('offline');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectTrace = (traceId: string) => {
    const trace = metrics?.recentTraces.find((t) => t.paymentIntentId === traceId) || null;
    setSelectedTrace(trace);
    setActiveTab('trace');
  };

  const handleTraceGenerated = (trace: DecisionTraceDTO) => {
    setSelectedTrace(trace);
    fetchInitialData();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      {/* ── Senior Staff Modular Sidebar ─────────────────── */}
      <ControlPlaneSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        totalIntentsCount={metrics?.summary.totalIntents}
        pendingApprovalsCount={pendingApprovalsCount}
        hasActiveTrace={Boolean(selectedTrace)}
        onOpenCommand={() => setCommandOpen(true)}
      />

      {/* ── Main Workspace Area ─────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ControlPlaneHeader
          apiStatus={apiStatus}
          gatewayMode="razorpay"
          onRefresh={() => {
            fetchInitialData();
            toast.success('Control plane state refreshed');
          }}
          isRefreshing={isRefreshing}
          onOpenCommand={() => setCommandOpen(true)}
          onToggleSidebar={() => setIsCollapsed((prev) => !prev)}
          pendingApprovalsCount={pendingApprovalsCount}
          onNavigateToApprovals={() => setActiveTab('approvals')}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-7 space-y-5">
            {activeTab === 'studio' && (
              <AgentStudioView onSimulateAgent={() => setActiveTab('console')} />
            )}

            {activeTab === 'approvals' && (
              <SupervisorQueueView
                onSelectTrace={handleSelectTrace}
                onApprovalResolved={fetchInitialData}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                isLoading={isRefreshing && !metrics}
                onSelectTrace={handleSelectTrace}
                onNavigateToConsole={() => setActiveTab('console')}
              />
            )}

            {activeTab === 'console' && (
              <AgentConsoleView onTraceGenerated={handleTraceGenerated} />
            )}

            {activeTab === 'trace' && (
              <DecisionTraceView
                trace={selectedTrace}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'policies' && (
              <PoliciesView onPolicyUpdated={fetchInitialData} />
            )}

            {activeTab === 'attack-lab' && <AttackLabView />}

            {activeTab === 'evaluation' && <EvaluationView />}

            {activeTab === 'audit' && <AuditLedgerView onSelectTrace={handleSelectTrace} />}
          </div>
        </main>
      </div>

      {/* ── Omni Command Palette (⌘K) ───────────────── */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search commands, navigate views, or change settings..." />
        <CommandList>
          <CommandEmpty>No matching commands found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                setActiveTab('studio');
                setCommandOpen(false);
              }}
            >
              <Bot className="mr-2 h-4 w-4" />
              <span>Agent Studio (Fleet & Tokens)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('approvals');
                setCommandOpen(false);
              }}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>Supervisor Approval Queue</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('dashboard');
                setCommandOpen(false);
              }}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Workbench Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('console');
                setCommandOpen(false);
              }}
            >
              <Zap className="mr-2 h-4 w-4" />
              <span>Agent Simulator</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('trace');
                setCommandOpen(false);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Decision Trace Inspector</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('policies');
                setCommandOpen(false);
              }}
            >
              <Sliders className="mr-2 h-4 w-4" />
              <span>Policy Boundaries</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('attack-lab');
                setCommandOpen(false);
              }}
            >
              <Flame className="mr-2 h-4 w-4" />
              <span>Adversarial Attack Lab</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('evaluation');
                setCommandOpen(false);
              }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Continuous Safety Benchmarks</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setActiveTab('audit');
                setCommandOpen(false);
              }}
            >
              <Database className="mr-2 h-4 w-4" />
              <span>Cryptographic Audit Ledger</span>
            </CommandItem>
          </CommandGroup>

          <CmdSeparator />

          <CommandGroup heading="Appearance">
            <CommandItem
              onSelect={() => {
                setTheme('light');
                setCommandOpen(false);
                toast.info('Light theme activated');
              }}
            >
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme('dark');
                setCommandOpen(false);
                toast.info('Dark Mode (Obsidian)');
              }}
            >
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode (Obsidian)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme('system');
                setCommandOpen(false);
                toast.info('System theme synced');
              }}
            >
              <Laptop className="mr-2 h-4 w-4" />
              <span>System Theme</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
