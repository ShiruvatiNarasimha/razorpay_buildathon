'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Shield,
  Key,
  Code2,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Building2,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Trash2,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AgentModel,
  AgentTokenDTO,
  CreateAgentRequest,
  CreateAgentTokenRequest,
  AgentToolDefinitionsResponse,
} from '@/types/contracts';
import { ApiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface AgentStudioViewProps {
  onSimulateAgent?: (agentId: string) => void;
}

export function AgentStudioView({ onSimulateAgent }: AgentStudioViewProps) {
  const [agents, setAgents] = useState<AgentModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentModel | null>(null);
  const [toolDefs, setToolDefs] = useState<AgentToolDefinitionsResponse | null>(null);
  const [agentTokens, setAgentTokens] = useState<AgentTokenDTO[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isToolDefsModalOpen, setIsToolDefsModalOpen] = useState(false);

  // Creation form state
  const [newAgentId, setNewAgentId] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDesc, setNewAgentDesc] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('custom_autonomous_agent');
  const [newSingleCapRupees, setNewSingleCapRupees] = useState('4000');
  const [newDailyCapRupees, setNewDailyCapRupees] = useState('5000');
  const [newReviewThresholdRupees, setNewReviewThresholdRupees] = useState('3000');
  const [newAllowedMerchants, setNewAllowedMerchants] = useState('Nike, Adidas, Puma, Amazon, Flipkart');
  const [newBlockedMerchants, setNewBlockedMerchants] = useState('Darknet Store, Suspicious Casino');
  const [newPermissions, setNewPermissions] = useState<string[]>(['payment:create', 'payment:read']);

  // Token issuance state
  const [tokenName, setTokenName] = useState('');
  const [tokenSpendLimitRupees, setTokenSpendLimitRupees] = useState('10000');
  const [tokenExpiryDays, setTokenExpiryDays] = useState('30');
  const [createdToken, setCreatedToken] = useState<AgentTokenDTO | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getAgents();
      setAgents(res.agents);
      if (res.agents.length > 0 && !selectedAgent) {
        setSelectedAgent(res.agents[0]);
      }
    } catch {
      toast.error('Failed to load agents from Agent Studio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAgentForTools = async (agent: AgentModel) => {
    setSelectedAgent(agent);
    try {
      const defs = await ApiClient.getAgentToolDefinitions(agent.id);
      setToolDefs(defs);
      setIsToolDefsModalOpen(true);
    } catch {
      toast.error(`Failed to load tool definitions for ${agent.name}`);
    }
  };

  const handleOpenTokenModal = async (agent: AgentModel) => {
    setSelectedAgent(agent);
    setTokenName(`${agent.name} Scoped Token`);
    setTokenSpendLimitRupees(`${(agent.dailyLimitPaise * 2) / 100}`);
    setCreatedToken(null);
    setIsTokenModalOpen(true);

    try {
      const res = await ApiClient.getAgentTokens(agent.id);
      setAgentTokens(res.tokens);
    } catch {
      // Ignore
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentId.trim() || !newAgentName.trim()) {
      toast.error('Agent ID and Name are required');
      return;
    }

    try {
      const payload: CreateAgentRequest = {
        id: newAgentId.trim().toLowerCase().replace(/\s+/g, '-'),
        name: newAgentName.trim(),
        description: newAgentDesc.trim() || `Autonomous agent ${newAgentName}`,
        role: newAgentRole,
        singleTxnLimitPaise: Math.round(parseFloat(newSingleCapRupees) * 100),
        dailyLimitPaise: Math.round(parseFloat(newDailyCapRupees) * 100),
        requireApprovalAbovePaise: newReviewThresholdRupees
          ? Math.round(parseFloat(newReviewThresholdRupees) * 100)
          : null,
        allowedMerchants: newAllowedMerchants
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        blockedMerchants: newBlockedMerchants
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean),
        permissions: newPermissions,
      };

      const created = await ApiClient.createAgent(payload);
      toast.success(`Autonomous Agent "${created.name}" provisioned successfully`);
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchAgents();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleIssueToken = async () => {
    if (!selectedAgent) return;

    try {
      const token = await ApiClient.issueAgentToken(selectedAgent.id, {
        agentId: selectedAgent.id,
        name: tokenName || `${selectedAgent.name} Token`,
        maxSpendLimitPaise: Math.round(parseFloat(tokenSpendLimitRupees) * 100),
        expiresInDays: parseInt(tokenExpiryDays, 10) || 30,
        permissions: selectedAgent.permissions,
      });

      setCreatedToken(token);
      toast.success('Scoped Delegation Token issued');
      const res = await ApiClient.getAgentTokens(selectedAgent.id);
      setAgentTokens(res.tokens);
      fetchAgents();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleRevokeToken = async (tokenString: string) => {
    try {
      await ApiClient.revokeAgentToken(tokenString);
      toast.success('Delegation Token revoked');
      if (selectedAgent) {
        const res = await ApiClient.getAgentTokens(selectedAgent.id);
        setAgentTokens(res.tokens);
        fetchAgents();
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const applyPreset = (preset: 'ecommerce' | 'procurement' | 'finops' | 'refund') => {
    if (preset === 'ecommerce') {
      setNewAgentId('style-shopper-bot');
      setNewAgentName('Style Concierge Bot');
      setNewAgentDesc('Personal shopping assistant for apparel and footwear recommendations');
      setNewAgentRole('e_commerce_assistant');
      setNewSingleCapRupees('3500');
      setNewDailyCapRupees('5000');
      setNewReviewThresholdRupees('2500');
      setNewAllowedMerchants('Nike, Adidas, Puma, Zara, H&M');
      setNewBlockedMerchants('Darknet Store, Suspicious Casino');
      setNewPermissions(['payment:create', 'payment:read']);
    } else if (preset === 'procurement') {
      setNewAgentId('enterprise-supply-bot');
      setNewAgentName('Enterprise Supply Bot');
      setNewAgentDesc('B2B restocking agent for office hardware and SaaS seat renewals');
      setNewAgentRole('procurement_officer');
      setNewSingleCapRupees('15000');
      setNewDailyCapRupees('30000');
      setNewReviewThresholdRupees('8000');
      setNewAllowedMerchants('Amazon, Dell, AWS, Google Cloud, Microsoft');
      setNewBlockedMerchants('Darknet Store, Suspicious Casino');
      setNewPermissions(['payment:create', 'payment:read', 'refund:create']);
    } else if (preset === 'finops') {
      setNewAgentId('cloud-finops-scaler');
      setNewAgentName('Cloud FinOps Auto-Scaler');
      setNewAgentDesc('Infrastructure agent purchasing reserved compute capacity upon traffic surges');
      setNewAgentRole('devops_cloud_finops');
      setNewSingleCapRupees('8000');
      setNewDailyCapRupees('20000');
      setNewReviewThresholdRupees('5000');
      setNewAllowedMerchants('AWS, Google Cloud, Azure, Cloudflare, DigitalOcean');
      setNewBlockedMerchants('Darknet Store');
      setNewPermissions(['payment:create', 'payment:read']);
    } else if (preset === 'refund') {
      setNewAgentId('tier1-refund-assistant');
      setNewAgentName('Tier-1 Support Refund Agent');
      setNewAgentDesc('Customer support agent issuing fast refunds under ₹1,500 with audit ledgering');
      setNewAgentRole('customer_support_refund');
      setNewSingleCapRupees('1500');
      setNewDailyCapRupees('10000');
      setNewReviewThresholdRupees('1000');
      setNewAllowedMerchants('*');
      setNewBlockedMerchants('');
      setNewPermissions(['payment:read', 'refund:create']);
    }
  };

  const resetCreateForm = () => {
    setNewAgentId('');
    setNewAgentName('');
    setNewAgentDesc('');
    setNewAgentRole('custom_autonomous_agent');
    setNewSingleCapRupees('4000');
    setNewDailyCapRupees('5000');
    setNewReviewThresholdRupees('3000');
    setNewAllowedMerchants('Nike, Adidas, Puma, Amazon, Flipkart');
    setNewBlockedMerchants('Darknet Store, Suspicious Casino');
    setNewPermissions(['payment:create', 'payment:read']);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ── Studio Header Strip ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-lg border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-4 shadow-xs gradient-mesh">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <h2 className="text-xs font-semibold tracking-tight text-foreground uppercase tracking-wider">
                Agent Studio & Financial Fleet Provisioning
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10 h-4.5 px-1.5"
              >
                Razorpay Buildathon Edition
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Provision autonomous AI agents, issue cryptographically scoped delegation tokens, and export drop-in tool schemas.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 z-10">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Provision Agent</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Fleet KPI Metrics Overview Strip ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Provisioned Agents</span>
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">{agents.length}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100% Active</span>
          </div>
        </div>

        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Active Tokens</span>
            <Key className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">
              {agents.reduce((acc, a) => acc + (a.activeTokensCount || 0), 0)}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">HMAC-SHA256</span>
          </div>
        </div>

        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Fleet Daily Budget</span>
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">
              ₹{(agents.reduce((acc, a) => acc + a.dailyLimitPaise, 0) / 100).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Bounded</span>
          </div>
        </div>

        <div className="saas-card rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">24h Fleet Spend</span>
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">
              ₹{(agents.reduce((acc, a) => acc + a.totalSpentPaise, 0) / 100).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Razorpay Settled</span>
          </div>
        </div>
      </div>

      {/* ── Agent Fleet Cards Grid ────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted/30" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {agents.map((agent) => {
            const isUnauthorized = agent.id.includes('unauthorized') || agent.id.includes('rogue');
            const dailySpentPercent =
              agent.dailyLimitPaise > 0
                ? Math.min(100, (agent.totalSpentPaise / agent.dailyLimitPaise) * 100)
                : 0;

            return (
              <div
                key={agent.id}
                className={`saas-card rounded-lg p-4.5 flex flex-col justify-between transition-all border ${
                  isUnauthorized
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-border/70 hover:border-primary/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isUnauthorized
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <Bot className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-foreground tracking-tight">
                          {agent.name}
                        </h3>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          ID: {agent.id}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono h-4 px-1.5 uppercase ${
                        isUnauthorized
                          ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10'
                          : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      }`}
                    >
                      {isUnauthorized ? 'Zero Auth' : 'Active Fleet'}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>

                  {/* Financial Bounds Matrix */}
                  <div className="rounded-md border border-border/50 bg-muted/20 p-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Single-Txn Hard Cap:</span>
                      <span className="font-mono font-semibold text-foreground tabular-nums text-[11px]">
                        ₹{(agent.singleTxnLimitPaise / 100).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Daily Allowance:</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          ₹{(agent.totalSpentPaise / 100).toLocaleString('en-IN')} / ₹
                          {(agent.dailyLimitPaise / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            dailySpentPercent > 80
                              ? 'bg-rose-500'
                              : dailySpentPercent > 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${dailySpentPercent}%` }}
                        />
                      </div>
                    </div>

                    {agent.requireApprovalAbovePaise !== null && agent.requireApprovalAbovePaise > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400">
                        <span>Review Trigger Above:</span>
                        <span className="font-mono font-medium tabular-nums">
                          ₹{(agent.requireApprovalAbovePaise / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Whitelist Merchants */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Whitelisted Merchants ({agent.allowedMerchants.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {agent.allowedMerchants.slice(0, 4).map((m) => (
                        <Badge
                          key={m}
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 h-4 font-normal"
                        >
                          {m}
                        </Badge>
                      ))}
                      {agent.allowedMerchants.length > 4 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{agent.allowedMerchants.length - 4} more
                        </span>
                      )}
                      {agent.allowedMerchants.length === 0 && (
                        <span className="text-[10px] text-rose-500 italic">None (Blocked)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border/50 mt-3 flex items-center justify-between gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenTokenModal(agent)}
                    className="h-7 text-[11px] px-2 gap-1"
                  >
                    <Key className="h-3 w-3 text-muted-foreground" />
                    <span>Tokens ({agent.activeTokensCount})</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAgentForTools(agent)}
                    className="h-7 text-[11px] px-2 gap-1 text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                  >
                    <Code2 className="h-3 w-3" />
                    <span>Tool Specs</span>
                  </Button>

                  {onSimulateAgent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSimulateAgent(agent.id)}
                      className="h-7 text-[11px] px-2 gap-1"
                    >
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span>Test</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Provision Agent Modal ─────────────────────────────────── */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Provision Autonomous Agent (Agent Studio)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Establish deterministic safety boundaries, single-transaction caps, and merchant policies.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Presets Strip */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-[11px] text-muted-foreground">Quick Role Presets:</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('ecommerce')}
                className="h-7 text-[10px] px-1.5"
              >
                🛒 E-Commerce
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('procurement')}
                className="h-7 text-[10px] px-1.5"
              >
                🏢 Procurement
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('finops')}
                className="h-7 text-[10px] px-1.5"
              >
                ☁️ Cloud FinOps
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('refund')}
                className="h-7 text-[10px] px-1.5"
              >
                🎧 Support Refund
              </Button>
            </div>
          </div>

          <form onSubmit={handleCreateAgent} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Agent Unique Identifier (ID)</Label>
                <Input
                  placeholder="e.g. style-shopper-bot"
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Display Name</Label>
                <Input
                  placeholder="e.g. Style Concierge Bot"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Description & Purpose</Label>
              <Input
                placeholder="Brief description of the autonomous agent's mandate"
                value={newAgentDesc}
                onChange={(e) => setNewAgentDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Max Single Txn (₹)</Label>
                <Input
                  type="number"
                  placeholder="4000"
                  value={newSingleCapRupees}
                  onChange={(e) => setNewSingleCapRupees(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Daily Spend Cap (₹)</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={newDailyCapRupees}
                  onChange={(e) => setNewDailyCapRupees(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Supervisor Trigger (₹)</Label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={newReviewThresholdRupees}
                  onChange={(e) => setNewReviewThresholdRupees(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Allowed Merchants (Comma separated)</Label>
              <Input
                placeholder="Nike, Adidas, Puma, Amazon, Flipkart"
                value={newAllowedMerchants}
                onChange={(e) => setNewAllowedMerchants(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Blocked Merchants (Blacklist)</Label>
              <Input
                placeholder="Darknet Store, Suspicious Casino"
                value={newBlockedMerchants}
                onChange={(e) => setNewBlockedMerchants(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Register Agent</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Scoped Delegation Tokens Modal ───────────────────────── */}
      <Dialog open={isTokenModalOpen} onOpenChange={setIsTokenModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <span>Scoped Delegation Tokens: {selectedAgent?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cryptographically signed Agent API tokens with hard financial budgets and expiration dates.
            </DialogDescription>
          </DialogHeader>

          {/* Newly Issued Token Display Banner */}
          {createdToken && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Delegation Token Issued Successfully</span>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600">
                  Cap: ₹{(createdToken.maxSpendLimitPaise / 100).toLocaleString('en-IN')}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background/80 px-2 py-1 font-mono text-xs break-all border border-border/70">
                  {createdToken.token}
                </code>
                <Button
                  size="sm"
                  onClick={() => handleCopy(createdToken.token, 'Delegation Token')}
                  className="h-7 px-2.5 text-xs shrink-0 gap-1"
                >
                  {copiedText === createdToken.token ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>Copy</span>
                </Button>
              </div>
            </div>
          )}

          {/* Issue New Token Form */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
            <h4 className="text-xs font-semibold text-foreground">Issue New Bounded Token</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px]">Token Description / Label</Label>
                <Input
                  placeholder="e.g. Production Shopping Worker Token"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">Spend Cap (₹)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={tokenSpendLimitRupees}
                  onChange={(e) => setTokenSpendLimitRupees(e.target.value)}
                  className="h-7 text-xs font-mono"
                />
              </div>
            </div>

            <Button
              onClick={handleIssueToken}
              size="sm"
              className="h-7 text-xs gap-1.5 w-full bg-primary text-primary-foreground"
            >
              <Key className="h-3 w-3" />
              <span>Generate Signed Token</span>
            </Button>
          </div>

          {/* Existing Tokens Table */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Delegation Tokens ({agentTokens.length})
            </h4>

            {agentTokens.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No tokens found for this agent.</p>
            ) : (
              <div className="space-y-2">
                {agentTokens.map((tok) => (
                  <div
                    key={tok.id}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-card p-2.5 text-xs gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">{tok.name}</span>
                        {tok.revoked ? (
                          <Badge variant="outline" className="text-[9px] border-rose-500/30 text-rose-500">
                            Revoked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span>Remaining: ₹{(tok.remainingSpendLimitPaise / 100).toLocaleString('en-IN')}</span>
                        <span>•</span>
                        <span>Expires: {new Date(tok.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(tok.token, 'Token')}
                        className="h-6.5 px-2 text-[10px] gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </Button>
                      {!tok.revoked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeToken(tok.token)}
                          className="h-6.5 px-2 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Tool Definitions & SDK Exporter Modal ─────────────────── */}
      <Dialog open={isToolDefsModalOpen} onOpenChange={setIsToolDefsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span>Drop-In Agent Tool Definitions: {toolDefs?.agentName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Standardized tool calling schemas for OpenAI Function Calling, Anthropic Tools, LangChain, and Model Context Protocol (MCP).
            </DialogDescription>
          </DialogHeader>

          {toolDefs && (
            <Tabs defaultValue="python" className="w-full pt-2">
              <TabsList className="grid grid-cols-4 h-8 text-xs bg-muted/60 p-0.5">
                <TabsTrigger value="python" className="text-[11px] h-7">
                  Python (LangChain)
                </TabsTrigger>
                <TabsTrigger value="openai" className="text-[11px] h-7">
                  OpenAI Function
                </TabsTrigger>
                <TabsTrigger value="mcp" className="text-[11px] h-7">
                  Model Context (MCP)
                </TabsTrigger>
                <TabsTrigger value="typescript" className="text-[11px] h-7">
                  TypeScript SDK
                </TabsTrigger>
              </TabsList>

              {/* Python LangChain */}
              <TabsContent value="python" className="space-y-2 pt-2">
                <div className="relative">
                  <pre className="rounded-lg border border-border/70 bg-muted/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                    {toolDefs.pythonLangChainSnippet}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(toolDefs.pythonLangChainSnippet, 'Python Snippet')}
                    className="absolute top-2 right-2 h-6 px-2 text-[10px] gap-1 bg-background/80"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </Button>
                </div>
              </TabsContent>

              {/* OpenAI Function Calling */}
              <TabsContent value="openai" className="space-y-2 pt-2">
                <div className="relative">
                  <pre className="rounded-lg border border-border/70 bg-muted/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                    {JSON.stringify(toolDefs.openAIFunction, null, 2)}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(JSON.stringify(toolDefs.openAIFunction, null, 2), 'OpenAI Schema')}
                    className="absolute top-2 right-2 h-6 px-2 text-[10px] gap-1 bg-background/80"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </Button>
                </div>
              </TabsContent>

              {/* MCP Tool Schema */}
              <TabsContent value="mcp" className="space-y-2 pt-2">
                <div className="relative">
                  <pre className="rounded-lg border border-border/70 bg-muted/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                    {JSON.stringify(toolDefs.modelContextProtocolMCP, null, 2)}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(JSON.stringify(toolDefs.modelContextProtocolMCP, null, 2), 'MCP Schema')}
                    className="absolute top-2 right-2 h-6 px-2 text-[10px] gap-1 bg-background/80"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </Button>
                </div>
              </TabsContent>

              {/* TypeScript SDK */}
              <TabsContent value="typescript" className="space-y-2 pt-2">
                <div className="relative">
                  <pre className="rounded-lg border border-border/70 bg-muted/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                    {toolDefs.typeScriptSnippet}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(toolDefs.typeScriptSnippet, 'TypeScript Snippet')}
                    className="absolute top-2 right-2 h-6 px-2 text-[10px] gap-1 bg-background/80"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
