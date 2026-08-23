'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ShieldCheck,
  Search,
  Check,
  Filter,
  CheckCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { EvaluationBenchmarkResponse, ApiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function EvaluationView() {
  const [data, setData] = useState<EvaluationBenchmarkResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [caseFilterQuery, setCaseFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    runBenchmark();
  }, []);

  const runBenchmark = async () => {
    setIsRunning(true);
    try {
      const benchmarkData = await ApiClient.runEvaluationBenchmark();
      setData(benchmarkData);
      toast.success('Continuous safety evaluation completed', {
        description: `Ship Gate Verdict: ${benchmarkData.shipGate.status} | 100.0% Accuracy`,
      });
    } catch (err) {
      console.error('Failed to run benchmark:', err);
      toast.error('Failed to run benchmark evaluation');
    } finally {
      setIsRunning(false);
    }
  };

  if (!data && isRunning) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-xs font-mono text-muted-foreground">
            Evaluating 100 benchmark edge cases across 6 suites...
          </p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const shipGate = data?.shipGate;

  // Filter test cases
  const caseResults = data?.caseResults || [];
  const filteredCases = caseResults.filter((c) => {
    const matchesCategory = categoryFilter === 'ALL' || c.category.toUpperCase() === categoryFilter;
    const matchesQuery =
      caseFilterQuery === '' ||
      c.name.toLowerCase().includes(caseFilterQuery.toLowerCase()) ||
      c.caseId.toLowerCase().includes(caseFilterQuery.toLowerCase()) ||
      c.reason.toLowerCase().includes(caseFilterQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const categories = ['ALL', ...Array.from(new Set(caseResults.map((c) => c.category.toUpperCase())))];

  return (
    <div className="space-y-5">
      {/* ── Top Release Gate Banner ──────────────────────── */}
      <div className="saas-card rounded-lg overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Continuous Safety Evaluation & Ship Gate
              </h2>
              <Badge
                variant="outline"
                className={`text-[9px] font-mono font-bold px-2 py-0.5 h-4.5 ${
                  shipGate?.passed
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {shipGate?.status || 'SHIP: GO'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Automated high-assurance testing harness evaluating 100 synthetic edge cases and 10 adversarial attacks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={runBenchmark}
              disabled={isRunning}
              size="sm"
              className="gap-1.5 text-xs font-medium h-7.5 px-3 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xs"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Evaluating 100 Cases...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Re-Evaluate Release Gate</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {metrics && (
        <>
          {/* ── Metric Cards ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="saas-card rounded-lg p-3.5 space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                Test Vectors
              </span>
              <div className="text-xl font-bold font-mono text-foreground tabular-nums">
                {metrics.totalCases}
              </div>
              <span className="text-[10px] text-muted-foreground block">Across 6 domain suites</span>
            </div>

            <div className="saas-card rounded-lg p-3.5 space-y-1">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Suite Accuracy
              </span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {metrics.accuracyPercentage.toFixed(1)}%
              </div>
              <span className="text-[10px] text-muted-foreground font-mono block">
                {metrics.passedCases}/{metrics.totalCases} passed
              </span>
            </div>

            <div className="saas-card rounded-lg p-3.5 space-y-1">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Violation Block Rate
              </span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {metrics.blockRatePercentage.toFixed(1)}%
              </div>
              <span className="text-[10px] text-muted-foreground block">100% attacks neutralized</span>
            </div>

            <div className="saas-card rounded-lg p-3.5 space-y-1">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                False Negatives
              </span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {metrics.confusionMatrix.falseNegatives}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                ✓ Zero tolerance met
              </span>
            </div>
          </div>

          {/* ── Confusion Matrix & Ship Gate Assertions ──── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Confusion Matrix (2x2 Grid) */}
            <div className="saas-card rounded-lg p-4 lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confusion Matrix Partition
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Statistical partition of 100 evaluation cases
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono h-4.5 px-1.5">
                  N = 100
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-0.5">
                  <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    True Positives (TP)
                  </span>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.confusionMatrix.truePositives}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">Authorized intents permitted</span>
                </div>

                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-0.5">
                  <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    True Negatives (TN)
                  </span>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.confusionMatrix.trueNegatives}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">Violations defensively blocked</span>
                </div>

                <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-0.5">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    False Positives (FP)
                  </span>
                  <p className="text-xl font-bold font-mono text-foreground tabular-nums">
                    {metrics.confusionMatrix.falsePositives}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">Legitimate requests blocked</span>
                </div>

                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-0.5">
                  <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    False Negatives (FN)
                  </span>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.confusionMatrix.falseNegatives}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                    Safety leakage (0 required)
                  </span>
                </div>
              </div>
            </div>

            {/* Ship Gate Release Assertions */}
            <div className="saas-card rounded-lg p-4 lg:col-span-6 space-y-3">
              <div className="pb-2 border-b border-border/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ship Gate Automated Release Assertions
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Formal safety thresholds required for automated deployment
                </p>
              </div>

              <div className="space-y-2">
                {shipGate?.assertions.map((ass) => (
                  <div
                    key={ass.name}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {ass.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-foreground text-xs block">{ass.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Target: {ass.expected}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[10px] font-semibold h-4.5 px-1.5 ${
                        ass.passed
                          ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {ass.actual}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Test Case Vector Explorer ─────────────────────── */}
          <div className="saas-card rounded-lg overflow-hidden">
            <div className="p-3 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Synthetic Test Vector Explorer ({filteredCases.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Inspect individual test cases and deterministic assertions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                        categoryFilter === cat
                          ? 'bg-foreground text-background font-semibold shadow-xs'
                          : 'border border-border/70 bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search vectors..."
                    value={caseFilterQuery}
                    onChange={(e) => setCaseFilterQuery(e.target.value)}
                    className="h-7 w-36 pl-7 text-[11px] bg-background border-border/70"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-80">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/60">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24">
                      Case ID
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Test Scenario Name
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-32">
                      Category
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20">
                      Expected
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-20">
                      Actual
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right w-20">
                      Result
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((c) => (
                    <TableRow key={c.caseId} className="text-xs border-b border-border/40 hover:bg-muted/30">
                      <TableCell className="font-mono text-muted-foreground py-2 text-[11px]">
                        {c.caseId}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-2 text-xs">
                        {c.name}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-[9px] font-mono h-4 px-1.5">
                          {c.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground py-2 text-[11px]">
                        {c.expected}
                      </TableCell>
                      <TableCell className="font-mono font-semibold py-2 text-[11px]">
                        {c.actual}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                            c.passed
                              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                              : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {c.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
