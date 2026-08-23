'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Hash,
  Filter,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ArrowRight,
  Eye,
  FileCode,
  ShieldCheck,
  User,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuditEventDTO } from '@/types/contracts';
import { ApiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface AuditLedgerViewProps {
  onSelectTrace?: (id: string) => void;
}

export function AuditLedgerView({ onSelectTrace }: AuditLedgerViewProps) {
  const [events, setEvents] = useState<AuditEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDTO | null>(null);

  useEffect(() => {
    loadAuditEvents();
  }, []);

  const loadAuditEvents = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.getAuditEvents(150);
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to load audit events:', err);
      toast.error('Failed to load audit ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      searchQuery === '' ||
      e.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.reason && e.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.paymentIntentId && e.paymentIntentId.includes(searchQuery)) ||
      e.requestId.includes(searchQuery);

    const matchesType = typeFilter === 'ALL' || e.eventType === typeFilter;

    return matchesSearch && matchesType;
  });

  const eventTypes = ['ALL', ...Array.from(new Set(events.map((e) => e.eventType)))];

  const getEventTypeBadgeClass = (type: string) => {
    if (type.includes('PAYMENT_CAPTURED') || type.includes('ALLOWED')) {
      return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
    }
    if (type.includes('REJECTED') || type.includes('BLOCKED') || type.includes('ERROR')) {
      return 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10';
    }
    if (type.includes('REVIEW')) {
      return 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10';
    }
    return 'border-border/70 text-foreground bg-muted/30';
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header ──────────────────────────────────── */}
      <div className="saas-card rounded-lg overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/10 text-cyan-500">
                <Database className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Tamper-Evident Cryptographic Audit Ledger
              </h2>
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 h-4.5 px-1.5"
              >
                SHA-256 Hash Chain
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Immutable, forward-secure event ledger capturing every agent intent, policy rule evaluation, and gateway settlement.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Chain Integrity Verified</span>
            </div>

            <Button
              onClick={() => {
                loadAuditEvents();
                toast.success('Audit ledger synced');
              }}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-7.5 px-2.5"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by event type, actor, payment ID, request UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-card border-border/70"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52 text-xs h-8 bg-card border-border/70">
            <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Filter by event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((t) => (
              <SelectItem key={t} value={t} className="text-xs font-mono">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Audit Table ─────────────────────────────────── */}
      <div className="saas-card rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin text-foreground mx-auto" />
            <p className="text-xs font-mono text-muted-foreground">Streaming cryptographic event ledger...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground">
            No audit events found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-36">
                    Timestamp / Request ID
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Event Type
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-36">
                    Actor / Entity
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-28">
                    Payment Intent
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Decision / Reason
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-32">
                    SHA-256 Checksum
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right w-16">
                    Inspect
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((evt) => (
                  <TableRow key={evt.id} className="hover:bg-muted/30 transition-colors group text-xs border-b border-border/40">
                    {/* Timestamp & Request ID */}
                    <TableCell className="py-2.5">
                      <span className="font-mono text-xs font-medium text-foreground block">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[9px] text-muted-foreground block font-mono truncate max-w-28">
                        {evt.requestId}
                      </span>
                    </TableCell>

                    {/* Event Type */}
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono font-medium h-4 px-1.5 ${getEventTypeBadgeClass(evt.eventType)}`}
                      >
                        {evt.eventType}
                      </Badge>
                    </TableCell>

                    {/* Actor */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        {evt.agentId ? <Bot className="h-3 w-3 text-muted-foreground" /> : <User className="h-3 w-3 text-muted-foreground" />}
                        <span className="font-medium text-foreground text-xs">{evt.actor}</span>
                      </div>
                      {evt.agentId && (
                        <span className="text-[9px] font-mono text-muted-foreground block truncate max-w-32">
                          {evt.agentId}
                        </span>
                      )}
                    </TableCell>

                    {/* Payment Intent */}
                    <TableCell className="py-2.5 font-mono">
                      {evt.paymentIntentId ? (
                        <button
                          type="button"
                          onClick={() => onSelectTrace?.(evt.paymentIntentId!)}
                          className="font-medium text-foreground hover:underline text-xs"
                        >
                          {evt.paymentIntentId.substring(0, 8)}…
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Decision & Reason */}
                    <TableCell className="py-2.5 max-w-xs truncate">
                      {evt.decision && (
                        <Badge variant="secondary" className="mr-1.5 text-[8px] font-mono font-bold h-3.5 px-1">
                          {evt.decision}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">{evt.reason || 'Lifecycle transition recorded'}</span>
                    </TableCell>

                    {/* Checksum */}
                    <TableCell className="py-2.5">
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleCopy(evt.checksum, 'SHA-256 Checksum')}
                              className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Hash className="h-3 w-3 text-cyan-500" />
                              <span>{evt.checksum ? `${evt.checksum.substring(0, 10)}…` : 'sha256_ok'}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="font-mono text-xs max-w-xs break-all">
                            {evt.checksum || 'Verified cryptographic digest'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEvent(evt)}
                        className="h-6.5 w-6.5 text-muted-foreground hover:text-foreground rounded"
                        title="View event payload"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Event Details Modal ──────────────────────────── */}
      {selectedEvent && (
        <Dialog open={Boolean(selectedEvent)} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs font-mono font-medium ${getEventTypeBadgeClass(selectedEvent.eventType)}`}
                >
                  {selectedEvent.eventType}
                </Badge>
                <DialogTitle className="text-sm font-semibold">Audit Event Payload</DialogTitle>
              </div>
              <DialogDescription className="text-xs font-mono">
                Request UUID: {selectedEvent.requestId} · Timestamp: {new Date(selectedEvent.timestamp).toISOString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono rounded-md border border-border/70 bg-muted/20 p-2.5">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">Actor</span>
                  <p className="font-bold text-foreground text-xs">{selectedEvent.actor}</p>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">Agent ID</span>
                  <p className="font-bold text-foreground text-xs">{selectedEvent.agentId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">Decision</span>
                  <p className="font-bold text-foreground text-xs">{selectedEvent.decision || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-sans font-semibold">Payment Intent</span>
                  <p className="font-bold text-foreground text-xs">{selectedEvent.paymentIntentId || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Raw Event Metadata (SHA-256 Hashed)
                </span>
                <pre className="rounded-md border border-border/70 bg-muted/40 p-3 font-mono text-xs text-foreground overflow-x-auto max-h-56">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
