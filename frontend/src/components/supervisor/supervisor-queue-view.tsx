'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Bot,
  RotateCcw,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Lock,
  Zap,
  Search,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { PendingApprovalDTO, SupervisorActionResult } from '@/types/contracts';
import { ApiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SupervisorQueueViewProps {
  onSelectTrace?: (traceId: string) => void;
  onApprovalResolved?: () => void;
}

export function SupervisorQueueView({
  onSelectTrace,
  onApprovalResolved,
}: SupervisorQueueViewProps) {
  const [pendingList, setPendingList] = useState<PendingApprovalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPending, setSelectedPending] = useState<PendingApprovalDTO | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'HIGH_VALUE' | 'RISK_ALERT'>('ALL');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getPendingApprovals();
      setPendingList(res.pending);
    } catch {
      toast.error('Failed to load supervisor approval queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (intentId: string) => {
    setProcessingId(intentId);
    try {
      const result: SupervisorActionResult = await ApiClient.resolveApproval(intentId, {
        supervisorId: 'alex_lead_fintech_supervisor',
        action: 'APPROVE',
        reason: 'Supervisor authorized execution after policy review',
      });

      toast.success('Approved! Payment executed and cryptographically verified on Razorpay');
      fetchPending();
      if (onApprovalResolved) onApprovalResolved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (pending: PendingApprovalDTO) => {
    setSelectedPending(pending);
    setRejectReason('Transaction exceeds budget safety parameters for autonomous agent.');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedPending) return;

    setProcessingId(selectedPending.paymentIntentId);
    try {
      await ApiClient.resolveApproval(selectedPending.paymentIntentId, {
        supervisorId: 'alex_lead_fintech_supervisor',
        action: 'REJECT',
        reason: rejectReason,
      });

      toast.info('Payment intent blocked and recorded in cryptographic audit ledger');
      setIsRejectModalOpen(false);
      fetchPending();
      if (onApprovalResolved) onApprovalResolved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPending = pendingList.filter((item) => {
    const matchesSearch =
      filterQuery === '' ||
      item.rawPrompt.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.agentName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.merchantName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.paymentIntentId.toLowerCase().includes(filterQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTabFilter === 'HIGH_VALUE') {
      return item.amountPaise >= 300000; // >= ₹3,000
    }
    if (activeTabFilter === 'RISK_ALERT') {
      return item.riskScore > 0 || item.riskLevel !== 'LOW';
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* ── Header Strip ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-lg border border-border/70 bg-gradient-to-r from-card via-card to-amber-500/5 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <h2 className="text-xs font-semibold tracking-tight text-foreground uppercase tracking-wider">
                Human-in-the-Loop Supervisor Queue (2-Man Rule)
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 h-4.5 px-1.5"
              >
                {pendingList.length} Pending Actions
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Authorize or reject flagged agent transactions exceeding review thresholds before Razorpay execution.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 z-10">
            <Button
              onClick={fetchPending}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Refresh Queue</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Pending Review</span>
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">{pendingList.length}</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Requires Sign-off</span>
          </div>
        </div>

        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Pending Value</span>
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">
              ₹{(pendingList.reduce((acc, p) => acc + p.amountPaise, 0) / 100).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Held in Escrow</span>
          </div>
        </div>

        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">High Value (&gt;₹3k)</span>
            <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">
              {pendingList.filter((p) => p.amountPaise >= 300000).length}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Threshold</span>
          </div>
        </div>

        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">2-Man Standard</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">Active</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">FSM Enforced</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search prompt, agent, merchant, or intent ID..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-card"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted/40 p-0.5 rounded-lg border border-border/60">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTabFilter('ALL')}
            className={`h-7 px-2.5 text-[11px] ${
              activeTabFilter === 'ALL'
                ? 'bg-background shadow-xs font-semibold text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            All ({pendingList.length})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTabFilter('HIGH_VALUE')}
            className={`h-7 px-2.5 text-[11px] ${
              activeTabFilter === 'HIGH_VALUE'
                ? 'bg-background shadow-xs font-semibold text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            High Value ({pendingList.filter((p) => p.amountPaise >= 300000).length})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTabFilter('RISK_ALERT')}
            className={`h-7 px-2.5 text-[11px] ${
              activeTabFilter === 'RISK_ALERT'
                ? 'bg-background shadow-xs font-semibold text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            Risk Flags ({pendingList.filter((p) => p.riskScore > 0 || p.riskLevel !== 'LOW').length})
          </Button>
        </div>
      </div>

      {/* ── Pending Approvals Stack ──────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 rounded-lg bg-muted/30" />
          ))}
        </div>
      ) : filteredPending.length === 0 ? (
        <div className="saas-card rounded-lg p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Supervisor Queue is Clear</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              All active autonomous agents are currently transacting within nominal limits. Flagged intents requiring 2-man authorization will appear here in real time.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPending.map((item) => {
            const isProcessing = processingId === item.paymentIntentId;

            return (
              <div
                key={item.paymentIntentId}
                className="saas-card rounded-lg p-4 border border-amber-500/30 bg-amber-500/5 space-y-3.5 transition-all"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {item.agentName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({item.agentId})
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Intent ID: {item.paymentIntentId} • {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-amber-500/40 text-amber-600 bg-amber-500/10 h-5"
                    >
                      Risk Score: {item.riskScore}/100 ({item.riskLevel})
                    </Badge>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  <div className="md:col-span-8 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Natural Language Prompt & Request
                    </span>
                    <p className="rounded-md border border-border/60 bg-card p-2 text-foreground font-medium text-xs">
                      &ldquo;{item.rawPrompt}&rdquo;
                    </p>

                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[11px] pt-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span><strong>Reason Flagged:</strong> {item.reviewReason}</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 rounded-md border border-border/60 bg-card p-3 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Merchant:</span>
                        <span className="font-semibold text-foreground">{item.merchantName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Requested Amount:</span>
                        <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                          ₹{(item.amountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRejectModal(item)}
                        disabled={isProcessing}
                        className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        <span>Reject</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.paymentIntentId)}
                        disabled={isProcessing}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        <span>{isProcessing ? 'Executing...' : 'Approve'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reject Modal ─────────────────────────────────────────── */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
              <span>Reject Payment Intent</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action deterministically halts the payment and records a tamper-evident rejection event in the SHA-256 audit ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Supervisor Rejection Reason</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for blocking this agent transaction..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReject}
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Confirm Rejection</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
