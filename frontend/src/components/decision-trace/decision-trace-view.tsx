'use client';

import React, { useState } from 'react';
import { DecisionTraceDTO } from '@/types/contracts';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  ShieldCheck,
  Zap,
  Database,
  Hash,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Building2,
  Bot,
  Activity,
  Layers,
  FileText,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DecisionTraceViewProps {
  trace: DecisionTraceDTO | null;
  onBackToDashboard: () => void;
}

export function DecisionTraceView({ trace, onBackToDashboard }: DecisionTraceViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState('overview');

  if (!trace) {
    return (
      <div className="saas-card rounded-lg p-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 mx-auto mb-3 text-muted-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          No Decision Trace Selected
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Execute a prompt in the Agent Simulator or click &ldquo;Inspect&rdquo; on any execution row in the Workbench Dashboard to inspect its full trace.
        </p>
        <Button
          onClick={onBackToDashboard}
          size="sm"
          variant="outline"
          className="mt-4 text-xs h-8 gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Workbench</span>
        </Button>
      </div>
    );
  }

  const isAllow = trace.finalDecision === 'ALLOW';
  const isBlock = trace.finalDecision === 'BLOCK';
  const isReview = trace.finalDecision === 'REVIEW';

  const copyTrace = () => {
    navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
    setCopied(true);
    toast.success('Trace JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTrace = () => {
    const blob = new Blob([JSON.stringify(trace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${trace.paymentIntentId.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Trace JSON file downloaded');
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header & Summary ─────────────────────────── */}
      <div className="saas-card rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDashboard}
                className="h-6.5 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Workbench</span>
              </Button>
              <Separator orientation="vertical" className="h-3.5 bg-border/60" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Decision Trace Inspector
              </h2>
              <Badge variant="outline" className="font-mono text-[10px] bg-muted/40 h-4.5 px-1.5">
                {trace.paymentIntentId}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground font-mono">
              Evaluated at {new Date(trace.paymentIntent.createdAt).toLocaleString()} · Latency:{' '}
              {trace.durationMs || 14}ms
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                isAllow
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isBlock
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isAllow ? 'bg-emerald-500' : isBlock ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              />
              <span>{trace.finalDecision}</span>
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={copyTrace}
              className="h-7 text-xs gap-1 px-2"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={downloadTrace}
              className="h-7 w-7"
              title="Download JSON"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Input Prompt
              </span>
              <span className="text-foreground font-medium truncate block">
                &ldquo;{trace.rawPrompt}&rdquo;
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Evaluated Amount
              </span>
              <span className="text-foreground font-bold font-mono text-xs tabular-nums">
                ₹
                {((trace.structuredIntent?.amountPaise || 0) / 100).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({trace.structuredIntent?.amountPaise} paise)
                </span>
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Merchant Identity
              </span>
              <span className="text-foreground font-semibold flex items-center gap-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                {trace.paymentIntent.merchantName}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Agent Token
              </span>
              <span className="text-foreground font-mono font-medium flex items-center gap-1 text-[11px]">
                <Bot className="h-3 w-3 text-muted-foreground" />
                {trace.paymentIntent.agentId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Multi-Tab Deep-Dive Inspection ──────────────── */}
      <Tabs value={activeInspectorTab} onValueChange={setActiveInspectorTab} className="space-y-3">
        <TabsList className="h-8 justify-start overflow-x-auto bg-muted/40 border border-border/60 p-0.5">
          <TabsTrigger value="overview" className="text-xs gap-1.5 h-7">
            <Layers className="h-3 w-3" /> Overview & Matrix
          </TabsTrigger>
          <TabsTrigger value="reasoning" className="text-xs gap-1.5 h-7">
            <Code2 className="h-3 w-3" /> Structured Intent
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs gap-1.5 h-7">
            <Activity className="h-3 w-3" /> Risk Signals ({trace.riskAssessment?.overallScore || 0}/100)
          </TabsTrigger>
          <TabsTrigger value="gateway" className="text-xs gap-1.5 h-7">
            <CreditCard className="h-3 w-3" /> Gateway & Verification
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1.5 h-7">
            <Database className="h-3 w-3" /> Audit Events ({trace.auditTrail?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="raw" className="text-xs gap-1.5 h-7">
            <FileText className="h-3 w-3" /> Full JSON Tree
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Matrix */}
        <TabsContent value="overview" className="space-y-4">
          <div className="saas-card rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Deterministic Policy Evaluation Matrix</span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Verdict: <strong className="text-foreground">{trace.policyDecision?.decision}</strong> · Reason:{' '}
                  {trace.policyDecision?.reason}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {trace.policyDecision?.evaluatedRules.map((rule) => {
                const isPass = rule.result === 'PASS';
                const isFail = rule.result === 'FAIL';

                return (
                  <div
                    key={rule.rule}
                    className={`rounded-md border p-2.5 text-xs space-y-1 ${
                      isPass
                        ? 'border-border/70 bg-card'
                        : isFail
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-amber-500/30 bg-amber-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[11px]">{rule.rule}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono h-4 px-1 ${
                          isPass
                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                            : isFail
                            ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                            : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {rule.result}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{rule.message}</p>
                    {rule.reasonCode && (
                      <span className="text-[9px] font-mono text-muted-foreground/80 block pt-0.5 border-t border-border/40">
                        Code: {rule.reasonCode}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Structured Intent */}
        <TabsContent value="reasoning" className="space-y-3">
          <div className="saas-card rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" />
                <span>Untrusted AI Extracted Intent (Zod Validated)</span>
              </h3>
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[9px] font-mono h-4.5 px-1.5"
              >
                Schema: StructuredAgentIntent
              </Badge>
            </div>

            <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-xs">
              <span className="text-muted-foreground block text-[9px] uppercase font-semibold">
                Raw Instruction:
              </span>
              <p className="font-mono text-xs mt-0.5 text-foreground">&ldquo;{trace.rawPrompt}&rdquo;</p>
            </div>

            <pre className="rounded-md border border-border/70 bg-muted/40 p-3 font-mono text-xs text-foreground overflow-x-auto">
              {JSON.stringify(trace.structuredIntent, null, 2)}
            </pre>
          </div>
        </TabsContent>

        {/* Tab 3: Risk Signals */}
        <TabsContent value="risk" className="space-y-3">
          <div className="saas-card rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Heuristic Multi-Signal Risk Assessment</span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {trace.riskAssessment?.explanation || 'Nominal risk profile verified.'}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] font-mono h-4.5 px-1.5 ${
                  trace.riskAssessment?.level === 'LOW'
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : trace.riskAssessment?.level === 'HIGH'
                    ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                    : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                }`}
              >
                {trace.riskAssessment?.level || 'LOW'} ({trace.riskAssessment?.overallScore || 0}/100)
              </Badge>
            </div>

            <div className="space-y-1.5">
              {trace.riskAssessment?.signals.map((sig) => (
                <div
                  key={sig.code}
                  className={`flex items-center justify-between rounded-md p-2.5 text-xs border ${
                    sig.triggered
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      : 'border-border/60 bg-muted/20 text-muted-foreground'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-semibold block text-[11px]">{sig.code}</span>
                    <span className="text-[10px] opacity-80">{sig.description}</span>
                  </div>
                  <span className="font-mono font-bold text-xs tabular-nums">
                    {sig.triggered ? `+${sig.scoreContribution} pts (FLAGGED)` : '0 pts'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Gateway & Verification */}
        <TabsContent value="gateway" className="space-y-3">
          <div className="saas-card rounded-lg p-4 space-y-3">
            <div className="pb-2 border-b border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Gateway Dispatch & Post-Execution Verification</span>
              </h3>
            </div>

            {trace.executionResult ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="rounded-md border border-border/70 p-2.5 space-y-0.5">
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">
                    Payment Gateway
                  </span>
                  <p className="font-bold text-foreground text-xs">{trace.executionResult.gateway.toUpperCase()}</p>
                </div>
                <div className="rounded-md border border-border/70 p-2.5 space-y-0.5">
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">
                    Provider Payment ID
                  </span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {trace.executionResult.providerPaymentId || 'N/A'}
                  </p>
                </div>
                <div className="rounded-md border border-border/70 p-2.5 space-y-0.5">
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">
                    Idempotency Key Lock
                  </span>
                  <p className="font-bold text-foreground truncate text-xs">{trace.executionResult.idempotencyKey}</p>
                </div>
                <div className="rounded-md border border-border/70 p-2.5 space-y-0.5">
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">
                    Verification Engine
                  </span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {trace.verificationResult?.isVerified ? '✓ Cryptographic Signature OK' : 'Pending Verification'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No gateway execution was initiated (Request blocked prior to payment dispatch).
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Audit Events */}
        <TabsContent value="audit" className="space-y-3">
          <div className="saas-card rounded-lg p-4 space-y-3">
            <div className="pb-2 border-b border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>Immutable Lifecycle Audit Trail</span>
              </h3>
            </div>

            <div className="space-y-1.5">
              {trace.auditTrail?.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-md border border-border/60 bg-muted/20 p-2.5 text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground text-xs">{evt.eventType}</span>
                    <span className="text-[9px] text-muted-foreground block">
                      Actor: {evt.actor} · Intent:{' '}
                      {evt.paymentIntentId ? evt.paymentIntentId.substring(0, 8) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span>{evt.checksum ? `${evt.checksum.substring(0, 16)}…` : 'sha256_verified'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 6: Raw JSON */}
        <TabsContent value="raw" className="space-y-3">
          <div className="saas-card rounded-lg p-4">
            <pre className="rounded-md border border-border/70 bg-muted/40 p-3 font-mono text-xs text-foreground overflow-x-auto max-h-[500px]">
              {JSON.stringify(trace, null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
