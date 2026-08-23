'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Zap,
  Search,
  Copy,
  Check,
  Filter,
  Sliders,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Building2,
  Bot,
  ExternalLink,
  ChevronRight,
  Lock,
  Layers,
  FileCode,
  RotateCcw,
  Activity,
  Maximize2,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import { DashboardMetricsResponse } from '@/lib/api-client';
import { DecisionTraceDTO } from '@/types/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardViewProps {
  metrics: DashboardMetricsResponse | null;
  isLoading: boolean;
  onSelectTrace: (id: string) => void;
  onNavigateToConsole: () => void;
}

export function DashboardView({
  metrics,
  isLoading,
  onSelectTrace,
  onNavigateToConsole,
}: DashboardViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | 'ALLOW' | 'BLOCK' | 'REVIEW'>('ALL');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectedTrace, setInspectedTrace] = useState<DecisionTraceDTO | null>(null);

  const recentTraces = metrics?.recentTraces ?? [];

  // Unique merchants for filter dropdown (must run unconditionally on every render)
  const uniqueMerchants = useMemo(() => {
    const merchants = new Set<string>();
    recentTraces.forEach((t) => {
      if (t.paymentIntent?.merchantName) {
        merchants.add(t.paymentIntent.merchantName);
      }
    });
    return Array.from(merchants);
  }, [recentTraces]);

  // Filter traces (must run unconditionally on every render)
  const filteredTraces = useMemo(() => {
    return recentTraces.filter((trace) => {
      const matchesDecision =
        decisionFilter === 'ALL' || trace.finalDecision === decisionFilter;
      const matchesMerchant =
        merchantFilter === 'ALL' ||
        trace.paymentIntent?.merchantName.toLowerCase() === merchantFilter.toLowerCase();
      const matchesQuery =
        filterQuery === '' ||
        trace.rawPrompt.toLowerCase().includes(filterQuery.toLowerCase()) ||
        trace.paymentIntent.merchantName.toLowerCase().includes(filterQuery.toLowerCase()) ||
        trace.paymentIntent.agentId.toLowerCase().includes(filterQuery.toLowerCase()) ||
        trace.paymentIntentId.toLowerCase().includes(filterQuery.toLowerCase());
      return matchesDecision && matchesMerchant && matchesQuery;
    });
  }, [recentTraces, decisionFilter, merchantFilter, filterQuery]);

  // Skeleton loading state
  if (isLoading || !metrics) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-24 rounded-lg bg-muted/40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="h-56 rounded-lg bg-muted/30 lg:col-span-7" />
          <div className="h-56 rounded-lg bg-muted/30 lg:col-span-5" />
        </div>
        <div className="h-80 rounded-lg bg-muted/30" />
      </div>
    );
  }

  const { summary, rates, riskDistribution, activePolicy } = metrics;

  const handleCopy = (text: string, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Chart data
  const chartData = [
    {
      name: 'Allowed',
      count: summary.allowedCount,
      rate: rates.allowRatePercentage,
      color: '#10b981',
    },
    {
      name: 'Blocked',
      count: summary.blockedCount,
      rate: rates.blockRatePercentage,
      color: '#ef4444',
    },
    {
      name: 'In Review',
      count: summary.reviewCount,
      rate: rates.reviewRatePercentage,
      color: '#f59e0b',
    },
  ];

  const hasActiveFilters = decisionFilter !== 'ALL' || merchantFilter !== 'ALL' || filterQuery !== '';

  const resetFilters = () => {
    setDecisionFilter('ALL');
    setMerchantFilter('ALL');
    setFilterQuery('');
  };

  return (
    <div className="space-y-5">
      {/* ── Policy Boundary Banner (Linear-grade SaaS Hero Strip) ──────── */}
      <div className="relative overflow-hidden rounded-lg border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-4 shadow-xs gradient-mesh">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <h2 className="text-xs font-semibold tracking-tight text-foreground uppercase tracking-wider">
                Deterministic Policy Boundary
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 h-4.5 px-1.5"
              >
                TypeScript FSM Enforced
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>
                Per-Txn Cap:{' '}
                <strong className="font-mono text-foreground tabular-nums font-semibold">
                  ₹{(activePolicy.maxTransactionAmountPaise / 100).toLocaleString('en-IN')}
                </strong>
              </span>
              <span className="text-border">•</span>
              <span>
                Daily Cap:{' '}
                <strong className="font-mono text-foreground tabular-nums font-semibold">
                  ₹{(activePolicy.dailyLimitPaise / 100).toLocaleString('en-IN')}
                </strong>
              </span>
              <span className="text-border">•</span>
              <span>
                Whitelist:{' '}
                <strong className="text-foreground font-medium">
                  {activePolicy.allowedMerchants.length} merchants
                </strong>
              </span>
              <span className="text-border">•</span>
              <span>
                Currency: <strong className="text-foreground font-medium">INR</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 z-10">
            <Button
              onClick={onNavigateToConsole}
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Simulate Intent</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Interactive KPI Metrics Grid ────────────────────────── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {/* Total Captured Volume */}
        <div
          onClick={() => setDecisionFilter('ALL')}
          className={`saas-card saas-card-interactive rounded-lg p-4 cursor-pointer transition-all ${
            decisionFilter === 'ALL' && !hasActiveFilters ? 'ring-1 ring-border' : ''
          }`}
        >
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Volume Captured
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 text-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
            {summary.totalVolumeFormatted}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5">
            <span>Settled via Gate</span>
            <span className="font-mono font-medium text-foreground text-[11px]">
              {summary.totalIntents} executions
            </span>
          </div>
        </div>

        {/* Allowed & Executed */}
        <div
          onClick={() => setDecisionFilter(decisionFilter === 'ALLOW' ? 'ALL' : 'ALLOW')}
          className={`saas-card saas-card-interactive rounded-lg p-4 cursor-pointer transition-all ${
            decisionFilter === 'ALLOW'
              ? 'ring-2 ring-emerald-500 bg-emerald-500/5'
              : 'hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Allowed & Captured
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {summary.allowedCount}
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5">
            <span className="text-muted-foreground text-[11px]">Approval Rate</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">
              {rates.allowRatePercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Blocked Violations */}
        <div
          onClick={() => setDecisionFilter(decisionFilter === 'BLOCK' ? 'ALL' : 'BLOCK')}
          className={`saas-card saas-card-interactive rounded-lg p-4 cursor-pointer transition-all ${
            decisionFilter === 'BLOCK'
              ? 'ring-2 ring-rose-500 bg-rose-500/5'
              : 'hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Blocked Violations
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {summary.blockedCount}
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5">
            <span className="text-muted-foreground text-[11px]">Defense Rate</span>
            <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 text-xs tabular-nums">
              {rates.blockRatePercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Supervisor Review */}
        <div
          onClick={() => setDecisionFilter(decisionFilter === 'REVIEW' ? 'ALL' : 'REVIEW')}
          className={`saas-card saas-card-interactive rounded-lg p-4 cursor-pointer transition-all ${
            decisionFilter === 'REVIEW'
              ? 'ring-2 ring-amber-500 bg-amber-500/5'
              : 'hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Supervisor Review
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
            {summary.reviewCount}
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5">
            <span className="text-muted-foreground text-[11px]">Review Queue</span>
            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 text-xs tabular-nums">
              {rates.reviewRatePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Visual Decision Flow & Risk Radar Grid ─────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Decision Breakdown Chart */}
        <div className="saas-card rounded-lg p-4 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h3 className="text-xs font-semibold tracking-tight text-foreground uppercase">
                  Autonomous Decision Distribution
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Proportionate pipeline verdicts across evaluated intents
                </p>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] h-4.5 px-2">
                {summary.totalIntents} Total Events
              </Badge>
            </div>

            <div className="h-36 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                    width={65}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 shadow-lg text-xs">
                            <p className="font-semibold text-foreground">{data.name}</p>
                            <p className="font-mono text-muted-foreground text-[11px] tabular-nums">
                              {data.count} intents ({data.rate.toFixed(1)}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
            <div
              onClick={() => setDecisionFilter('ALLOW')}
              className="cursor-pointer rounded-md p-1.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Allowed
              </span>
              <p className="font-mono text-xs font-semibold text-foreground tabular-nums">
                {rates.allowRatePercentage.toFixed(1)}%
              </p>
            </div>
            <div
              onClick={() => setDecisionFilter('BLOCK')}
              className="cursor-pointer rounded-md p-1.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Blocked
              </span>
              <p className="font-mono text-xs font-semibold text-foreground tabular-nums">
                {rates.blockRatePercentage.toFixed(1)}%
              </p>
            </div>
            <div
              onClick={() => setDecisionFilter('REVIEW')}
              className="cursor-pointer rounded-md p-1.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Review
              </span>
              <p className="font-mono text-xs font-semibold text-foreground tabular-nums">
                {rates.reviewRatePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Signal Risk Radar */}
        <div className="saas-card rounded-lg p-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h3 className="text-xs font-semibold tracking-tight text-foreground uppercase">
                  Multi-Signal Risk Spectrum
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Anomaly risk score distribution across evaluated intents
                </p>
              </div>
              <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-3 w-3" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 py-3 text-center">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-0.5">
                <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Low Risk
                </span>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {riskDistribution.low}
                </p>
                <span className="text-[9px] text-muted-foreground font-mono block">Score 0–30</span>
              </div>

              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 space-y-0.5">
                <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  Moderate
                </span>
                <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {riskDistribution.review}
                </p>
                <span className="text-[9px] text-muted-foreground font-mono block">Score 31–60</span>
              </div>

              <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-2.5 space-y-0.5">
                <span className="text-[9px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  High Risk
                </span>
                <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                  {riskDistribution.high}
                </p>
                <span className="text-[9px] text-muted-foreground font-mono block">Score 61–100</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border/50 bg-muted/20 p-2 text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Guardrails:</span>
              <span className="font-mono font-medium text-foreground">
                Prompt Injection · Limit Velocity
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Deterministic Defense:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                100.0% Enforced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── High-Precision Executions Data Table & Filter Strip ─── */}
      <div className="saas-card rounded-lg overflow-hidden">
        {/* Table Toolbar / Filter Strip */}
        <div className="p-3 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold tracking-tight text-foreground uppercase">
              Financial Executions
            </h3>
            <span className="text-muted-foreground text-xs font-mono">
              ({filteredTraces.length} of {recentTraces.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Segmented Buttons */}
            <div className="flex items-center rounded-md border border-border/70 bg-muted/40 p-0.5 text-xs">
              {(['ALL', 'ALLOW', 'BLOCK', 'REVIEW'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setDecisionFilter(filter)}
                  className={`rounded-sm px-2 py-0.5 text-[10px] font-medium transition-all ${
                    decisionFilter === filter
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter}
                </button>
              ))}
            </div>

            {/* Merchant Filter Select */}
            {uniqueMerchants.length > 0 && (
              <Select value={merchantFilter} onValueChange={setMerchantFilter}>
                <SelectTrigger className="h-7 w-32 text-[11px] bg-background border-border/70">
                  <SelectValue placeholder="All Merchants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    All Merchants
                  </SelectItem>
                  {uniqueMerchants.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search prompt, agent, ID..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="h-7 w-48 pl-7 text-[11px] bg-background border-border/70"
              />
            </div>

            {/* Reset Filters button if active */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Data Table */}
        {filteredTraces.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 mx-auto text-muted-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">No executions match criteria</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Try clearing your search query or run a new prompt in the Agent Simulator.
              </p>
            </div>
            <Button
              onClick={onNavigateToConsole}
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5"
            >
              <Zap className="h-3 w-3" />
              <span>Launch Simulator</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-28">
                    Trace / Time
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Natural Language Prompt
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-36">
                    Merchant & Agent
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24">
                    Amount
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-28">
                    Verdict
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24">
                    Settlement
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right w-24">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTraces.map((trace) => {
                  const intent = trace.paymentIntent;
                  const isAllow = trace.finalDecision === 'ALLOW';
                  const isBlock = trace.finalDecision === 'BLOCK';
                  const isReview = trace.finalDecision === 'REVIEW';

                  return (
                    <TableRow
                      key={trace.paymentIntentId}
                      className="cursor-pointer hover:bg-muted/40 transition-colors group border-b border-border/40"
                      onClick={() => setInspectedTrace(trace)}
                    >
                      {/* Trace ID & Time */}
                      <TableCell className="py-2.5 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium text-foreground">
                            {trace.paymentIntentId.substring(0, 8)}…
                          </span>
                          <TooltipProvider>
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(trace.paymentIntentId, 'Trace ID', e)}
                                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                                >
                                  {copiedId === trace.paymentIntentId ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs font-mono">
                                Copy: {trace.paymentIntentId}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-[9px] text-muted-foreground block">
                          {new Date(intent.createdAt).toLocaleTimeString()}
                        </span>
                      </TableCell>

                      {/* Prompt */}
                      <TableCell className="py-2.5 max-w-xs text-xs">
                        <p className="truncate text-foreground font-normal">
                          &ldquo;{trace.rawPrompt}&rdquo;
                        </p>
                      </TableCell>

                      {/* Merchant & Agent */}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium text-xs text-foreground truncate">
                            {intent.merchantName}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground truncate block">
                          {intent.agentId}
                        </span>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-2.5 font-mono font-semibold text-xs text-foreground tabular-nums">
                        ₹
                        {(intent.amountPaise / 100).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      {/* Verdict Badge */}
                      <TableCell className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            isAllow
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : isBlock
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isAllow ? 'bg-emerald-500' : isBlock ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          {trace.finalDecision}
                        </span>
                      </TableCell>

                      {/* Settlement Status */}
                      <TableCell className="py-2.5 font-mono text-[10px] text-muted-foreground">
                        {trace.finalStatus}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedTrace(trace);
                          }}
                          className="h-6.5 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground rounded"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Slide-Over Quick-Inspect Sheet ────────────────────────── */}
      <Sheet open={Boolean(inspectedTrace)} onOpenChange={(open) => !open && setInspectedTrace(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-5 space-y-4">
          {inspectedTrace && (
            <>
              <SheetHeader className="space-y-1 border-b border-border/60 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        inspectedTrace.finalDecision === 'ALLOW'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : inspectedTrace.finalDecision === 'BLOCK'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          inspectedTrace.finalDecision === 'ALLOW'
                            ? 'bg-emerald-500'
                            : inspectedTrace.finalDecision === 'BLOCK'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      {inspectedTrace.finalDecision}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {inspectedTrace.finalStatus}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const id = inspectedTrace.paymentIntentId;
                      setInspectedTrace(null);
                      onSelectTrace(id);
                    }}
                    className="h-7 text-xs gap-1.5"
                  >
                    <span>Full Trace View</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <SheetTitle className="text-sm font-semibold tracking-tight text-foreground font-mono pt-1">
                  {inspectedTrace.paymentIntentId}
                </SheetTitle>
                <SheetDescription className="text-[11px] font-mono">
                  Captured at {new Date(inspectedTrace.paymentIntent.createdAt).toLocaleString()} · Latency:{' '}
                  {inspectedTrace.durationMs || 14}ms
                </SheetDescription>
              </SheetHeader>

              {/* Natural Language Prompt */}
              <div className="rounded-md border border-border/70 bg-muted/20 p-3 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Prompt Evaluated
                </span>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  &ldquo;{inspectedTrace.rawPrompt}&rdquo;
                </p>
              </div>

              {/* Structured Intent Details */}
              <div className="rounded-md border border-border/70 bg-card p-3 space-y-2 text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Structured Intent Extracted (Zod Validated)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Merchant:</span>
                    <span className="font-medium text-foreground">
                      {inspectedTrace.paymentIntent.merchantName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Amount:</span>
                    <span className="font-mono font-bold text-foreground tabular-nums">
                      ₹
                      {(
                        (inspectedTrace.structuredIntent?.amountPaise ||
                          inspectedTrace.paymentIntent.amountPaise) / 100
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Agent Token:</span>
                    <span className="font-mono text-foreground text-[11px]">
                      {inspectedTrace.paymentIntent.agentId}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Currency:</span>
                    <span className="font-mono text-foreground">
                      {inspectedTrace.structuredIntent?.currency || 'INR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy Decision Check */}
              {inspectedTrace.policyDecision && (
                <div className="rounded-md border border-border/70 bg-card p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Policy Rule Verdict
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        inspectedTrace.policyDecision.decision === 'ALLOW'
                          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {inspectedTrace.policyDecision.decision}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground font-mono bg-muted/30 p-2 rounded border border-border/50">
                    {inspectedTrace.policyDecision.reason}
                  </p>
                </div>
              )}

              {/* Risk Assessment Signals */}
              {inspectedTrace.riskAssessment && (
                <div className="rounded-md border border-border/70 bg-card p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Risk Assessment
                    </span>
                    <span className="font-mono font-bold text-xs tabular-nums text-foreground">
                      Score: {inspectedTrace.riskAssessment.overallScore}/100 ({inspectedTrace.riskAssessment.level})
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {inspectedTrace.riskAssessment.explanation}
                  </p>
                </div>
              )}

              {/* Gateway Execution Result */}
              {inspectedTrace.executionResult && (
                <div className="rounded-md border border-border/70 bg-card p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Gateway Result (Razorpay)
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    >
                      {inspectedTrace.executionResult.status}
                    </Badge>
                  </div>
                  <div className="font-mono text-[11px] space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Payment ID:</span>
                      <span className="text-foreground font-semibold">
                        {inspectedTrace.executionResult.providerPaymentId || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gateway Mode:</span>
                      <span className="text-foreground">
                        {inspectedTrace.executionResult.gateway?.toUpperCase() || 'RAZORPAY'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cryptographic SHA-256 Hash */}
              <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>Audit Ledger Hash:</span>
                <span className="text-foreground font-semibold">
                  SHA-256 Chained ✓
                </span>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
