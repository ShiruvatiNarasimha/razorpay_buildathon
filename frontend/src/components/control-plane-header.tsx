'use client';

import React from 'react';
import {
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  Command,
  ShieldCheck,
  Zap,
  PanelLeft,
  Activity,
  Clock,
  ExternalLink,
  Award,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ControlPlaneHeaderProps {
  apiStatus: 'online' | 'offline' | 'checking';
  gatewayMode: 'mock' | 'razorpay';
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenCommand?: () => void;
  onToggleSidebar?: () => void;
  pendingApprovalsCount?: number;
  onNavigateToApprovals?: () => void;
}

export function ControlPlaneHeader({
  apiStatus,
  gatewayMode,
  onRefresh,
  isRefreshing,
  onOpenCommand,
  onToggleSidebar,
  pendingApprovalsCount = 0,
  onNavigateToApprovals,
}: ControlPlaneHeaderProps) {
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* Left side: Sidebar Toggle & Scope Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          title="Toggle Sidebar (⌘B)"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-4 bg-border/60" />

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground tracking-tight">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground text-[11px] font-mono shadow-sm">
              🛡️
            </span>
            <span>AgentPay</span>
          </div>

          <span className="text-muted-foreground/40 font-mono">/</span>

          <Badge
            variant="outline"
            className="h-5 gap-1.5 px-2 font-mono text-[10px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span>Razorpay Gateway Active</span>
          </Badge>

          <Badge
            variant="outline"
            className="hidden sm:inline-flex h-5 gap-1 px-2 font-mono text-[10px] text-muted-foreground border-border/60 bg-muted/20"
          >
            <Award className="h-3 w-3 text-amber-500" />
            <span>Buildathon 2026</span>
          </Badge>
        </div>
      </div>

      {/* Right side: Actions, Status, Theme, Quick Search */}
      <div className="flex items-center gap-2">
        {/* Supervisor Pending Alert Badge (Clickable) */}
        {pendingApprovalsCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onNavigateToApprovals}
                  className="flex items-center gap-1.5 h-7 px-2 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-medium animate-pulse hover:bg-amber-500/25 transition-all cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{pendingApprovalsCount} Review Required</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {pendingApprovalsCount} intent(s) awaiting 2-man rule supervisor authorization
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden h-8 w-48 items-center justify-between rounded-md border border-border/70 bg-muted/20 px-2.5 text-xs text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground transition-all md:flex"
        >
          <span className="flex items-center gap-1.5">
            <Command className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="font-normal text-[11px]">Command palette...</span>
          </span>
          <kbd className="pointer-events-none inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[9px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Live Engine Status Badge */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1 text-xs transition-colors">
                <span className="relative flex h-2 w-2">
                  {apiStatus === 'online' && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      apiStatus === 'online'
                        ? 'bg-emerald-500'
                        : apiStatus === 'checking'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </span>
                <span className="font-mono text-[11px] font-medium text-muted-foreground">
                  {apiStatus === 'online'
                    ? 'FSM Online (4ms)'
                    : apiStatus === 'checking'
                    ? 'Syncing...'
                    : 'Offline'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {apiStatus === 'online'
                ? 'Deterministic FSM Safety & Policy Engine connected (:4000)'
                : apiStatus === 'checking'
                ? 'Checking backend safety control plane connection...'
                : 'Unable to reach backend API.'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-4 bg-border/60" />

        {/* Refresh Sync Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-foreground' : ''}`} />
                <span className="sr-only">Refresh state</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Sync Real-Time Control Plane State
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2 text-xs cursor-pointer">
              <Sun className="h-3.5 w-3.5" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2 text-xs cursor-pointer">
              <Moon className="h-3.5 w-3.5" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2 text-xs cursor-pointer">
              <Laptop className="h-3.5 w-3.5" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

