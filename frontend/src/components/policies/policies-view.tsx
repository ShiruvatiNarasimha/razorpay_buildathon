'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  RotateCcw,
  Sliders,
  Building2,
  Ban,
  DollarSign,
  Zap,
  Code2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { PolicyConfig } from '@/types/contracts';
import { ApiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PoliciesViewProps {
  onPolicyUpdated: () => void;
}

const DEFAULT_POLICY: PolicyConfig = {
  userId: 'usr_demo_fintech_01',
  maxTransactionAmountPaise: 400000, // ₹4,000.00
  dailyLimitPaise: 500000, // ₹5,000.00
  allowedCurrencies: ['INR'],
  allowedMerchants: ['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart', 'Decathlon'],
  blockedMerchants: ['Darknet Store', 'Suspicious Casino', 'Untrusted Crypto Exchange'],
  requireReviewAboveAmountPaise: 300000, // ₹3,000.00
  maxVelocityPerMinute: 5,
  autoApproveWhitelistMerchants: false,
};

export function PoliciesView({ onPolicyUpdated }: PoliciesViewProps) {
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const [newAllowedMerchant, setNewAllowedMerchant] = useState('');
  const [newBlockedMerchant, setNewBlockedMerchant] = useState('');

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.getPolicies();
      setPolicy(data.policy);
    } catch (err) {
      console.error('Failed to load policy:', err);
      toast.error('Failed to load policy configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;

    if (policy.maxTransactionAmountPaise > policy.dailyLimitPaise) {
      toast.warning('Per-transaction limit exceeds daily spending cap');
    }

    setIsSaving(true);

    try {
      await ApiClient.updatePolicies(policy);
      toast.success('Policy configuration saved & enforced in real-time');
      onPolicyUpdated();
    } catch (err) {
      toast.error(`Policy update failed: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPolicy({ ...DEFAULT_POLICY });
    toast.info('Reset policy values to factory defaults');
  };

  if (isLoading || !policy) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-xs font-mono text-muted-foreground">Loading deterministic rules...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* ── Header Toolbar ─────────────────────────────── */}
      <div className="saas-card rounded-lg overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Deterministic Policy Engine
              </h2>
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 h-4.5 px-1.5"
              >
                100% Zero-LLM Evaluation
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Define strict transactional ceiling boundaries, merchant access-control lists, and velocity constraints.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowJson((prev) => !prev)}
              className="gap-1 text-xs h-7.5 px-2.5"
            >
              <Code2 className="h-3 w-3" />
              <span>{showJson ? 'Hide JSON' : 'View JSON'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1 text-xs h-7.5 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              size="sm"
              className="gap-1.5 text-xs font-medium h-7.5 px-3 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xs"
            >
              <Save className="h-3 w-3" />
              <span>{isSaving ? 'Enforcing...' : 'Save & Enforce'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Optional Live JSON View */}
      {showJson && (
        <div className="saas-card rounded-lg p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Runtime Policy Schema Preview
          </span>
          <pre className="rounded-md bg-muted/40 p-3 font-mono text-xs text-foreground overflow-x-auto border border-border/60">
            {JSON.stringify(policy, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Spending Ceilings ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Per-Transaction Limit */}
        <div className="saas-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Per-Transaction Max
            </h3>
            <Badge variant="secondary" className="font-mono text-[9px] h-4 px-1.5">
              INR (₹)
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Minor units in Paise (100 Paise = ₹1.00)
          </p>
          <Input
            type="number"
            value={policy.maxTransactionAmountPaise}
            onChange={(e) =>
              setPolicy({ ...policy, maxTransactionAmountPaise: parseInt(e.target.value, 10) || 0 })
            }
            className="font-mono text-xs h-8 bg-background"
          />
          <div className="rounded-md bg-muted/30 p-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">Ceiling:</span>
            <span className="font-mono font-bold text-foreground text-xs tabular-nums">
              ₹{(policy.maxTransactionAmountPaise / 100).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Daily Spending Cap */}
        <div className="saas-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Aggregate Cap
            </h3>
            <Badge variant="secondary" className="font-mono text-[9px] h-4 px-1.5">
              24h Window
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Total cumulative spend across all autonomous agents
          </p>
          <Input
            type="number"
            value={policy.dailyLimitPaise}
            onChange={(e) =>
              setPolicy({ ...policy, dailyLimitPaise: parseInt(e.target.value, 10) || 0 })
            }
            className="font-mono text-xs h-8 bg-background"
          />
          <div className="rounded-md bg-muted/30 p-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">Daily Limit:</span>
            <span className="font-mono font-bold text-foreground text-xs tabular-nums">
              ₹{(policy.dailyLimitPaise / 100).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Supervisor Review Threshold */}
        <div className="saas-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Supervisor Threshold
            </h3>
            <Badge variant="secondary" className="font-mono text-[9px] h-4 px-1.5">
              Manual Sign-off
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Transactions exceeding this require human approval
          </p>
          <Input
            type="number"
            value={policy.requireReviewAboveAmountPaise || 0}
            onChange={(e) =>
              setPolicy({
                ...policy,
                requireReviewAboveAmountPaise: parseInt(e.target.value, 10) || 0,
              })
            }
            className="font-mono text-xs h-8 bg-background"
          />
          <div className="rounded-md bg-muted/30 p-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">Review Trigger:</span>
            <span className="font-mono font-bold text-foreground text-xs tabular-nums">
              ₹{((policy.requireReviewAboveAmountPaise || 0) / 100).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Merchant Access Control Lists ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Whitelisted Merchants */}
        <div className="saas-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Whitelisted Merchants ({policy.allowedMerchants.length})
              </h3>
            </div>
            <Badge
              variant="outline"
              className="text-[9px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 h-4.5 px-1.5"
            >
              Auto-Dispatch Allowed
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Pre-approved commercial entities permitted for programmatic checkout
          </p>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add approved merchant (e.g. Decathlon, Apple)..."
              value={newAllowedMerchant}
              onChange={(e) => setNewAllowedMerchant(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!newAllowedMerchant.trim()) return;
                  setPolicy({
                    ...policy,
                    allowedMerchants: [...policy.allowedMerchants, newAllowedMerchant.trim()],
                  });
                  setNewAllowedMerchant('');
                }
              }}
              className="text-xs h-8 bg-background"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!newAllowedMerchant.trim()) return;
                setPolicy({
                  ...policy,
                  allowedMerchants: [...policy.allowedMerchants, newAllowedMerchant.trim()],
                });
                setNewAllowedMerchant('');
              }}
              className="h-8 px-2.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-14 rounded-md border border-border/60 bg-muted/20 p-2.5">
            {policy.allowedMerchants.map((m, idx) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                <span>{m}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...policy.allowedMerchants];
                    next.splice(idx, 1);
                    setPolicy({ ...policy, allowedMerchants: next });
                  }}
                  className="hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Blacklisted Merchants */}
        <div className="saas-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 text-rose-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Blacklisted Merchants ({policy.blockedMerchants.length})
              </h3>
            </div>
            <Badge
              variant="outline"
              className="text-[9px] font-mono border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 h-4.5 px-1.5"
            >
              Hard Block Enforced
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Explicitly rejected entities that trigger immediate defensive aborts
          </p>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add blacklisted entity..."
              value={newBlockedMerchant}
              onChange={(e) => setNewBlockedMerchant(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!newBlockedMerchant.trim()) return;
                  setPolicy({
                    ...policy,
                    blockedMerchants: [...policy.blockedMerchants, newBlockedMerchant.trim()],
                  });
                  setNewBlockedMerchant('');
                }
              }}
              className="text-xs h-8 bg-background"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!newBlockedMerchant.trim()) return;
                setPolicy({
                  ...policy,
                  blockedMerchants: [...policy.blockedMerchants, newBlockedMerchant.trim()],
                });
                setNewBlockedMerchant('');
              }}
              className="h-8 px-2.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-14 rounded-md border border-border/60 bg-muted/20 p-2.5">
            {policy.blockedMerchants.map((m, idx) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              >
                <span>{m}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...policy.blockedMerchants];
                    next.splice(idx, 1);
                    setPolicy({ ...policy, blockedMerchants: next });
                  }}
                  className="hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Additional Guardrail Parameters ────────────── */}
      <div className="saas-card rounded-lg p-4 space-y-3">
        <div className="pb-2 border-b border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5" />
            <span>Velocity Windows & Currency Guardrails</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Max Velocity Per Minute</Label>
            <Input
              type="number"
              value={policy.maxVelocityPerMinute || 5}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  maxVelocityPerMinute: parseInt(e.target.value, 10) || 1,
                })
              }
              className="font-mono text-xs h-8 bg-background"
            />
            <span className="text-[10px] text-muted-foreground">Burst throttling threshold</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Settlement Currencies</Label>
            <div className="flex items-center gap-2 pt-0.5">
              <Badge
                variant="outline"
                className="font-mono text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                INR (Indian Rupee)
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px] opacity-60">
                USD (Blocked)
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground">Strict currency enforcement</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Auto-Approve Whitelist</Label>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                checked={policy.autoApproveWhitelistMerchants || false}
                onCheckedChange={(checked) =>
                  setPolicy({ ...policy, autoApproveWhitelistMerchants: checked })
                }
              />
              <span className="text-xs text-muted-foreground font-mono">
                {policy.autoApproveWhitelistMerchants ? 'Enabled (Fast-track)' : 'Disabled (Full Rules)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
