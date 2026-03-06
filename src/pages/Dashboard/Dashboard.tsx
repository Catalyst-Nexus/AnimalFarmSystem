import { Routes, Route, Link } from 'react-router'
import { lazy, Suspense, useMemo, useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout/Layout'
import { useRBAC } from '@/contexts/RBACContext'
import { useAuthStore } from '@/store'
import UserProfile from '../UserProfile/UserProfile'
import Settings from '../Settings/Settings'
import {
  dashboardService,
  type DashboardStats,
  type AnimalByType,
  type AnimalBySex,
  type AnimalByStatus,
  type CageOccupancy,
  type InventoryByCategory,
  type RecentAnimal,
  type ExpiringItem,
  type RationTrend,
  type StockTransactionTrend,
} from '@/services/dashboardService'
import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'

// Dynamic component loader - loads any component by its file path
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
      <p className="text-muted">Loading module...</p>
    </div>
  </div>
)

// Build a map of all available modules using Vite's glob pattern
// This allows truly dynamic loading without hardcoding individual imports
const moduleMap = import.meta.glob('../../views/**/*.tsx', { eager: false, import: 'default' })

const DynamicComponentLoader = ({ filePath }: { filePath: string }) => {
  // Normalize the path (convert backslashes to forward slashes)
  const normalizedPath = filePath.replace(/\\/g, '/')
  const modulePath = `../../${normalizedPath}.tsx`

  // Memoize the lazy component based on filePath to ensure stable component reference
  // This prevents React Router from losing track of component transitions
  const Component = useMemo(() => {
    return lazy(() =>
      (async () => {
        try {
          const moduleLoader = moduleMap[modulePath]
          if (!moduleLoader) {
            throw new Error(`Module not found: ${modulePath}`)
          }
          const defaultExport = await moduleLoader()
          return { default: defaultExport as React.ComponentType }
        } catch (error: unknown) {
          console.error(`Failed to load module ${normalizedPath}:`, error)
          return {
            default: (() => (
              <div className="flex items-center justify-center h-96 text-red-500 flex-col gap-4">
                <p className="text-lg font-semibold">Failed to load module</p>
                <p className="text-sm text-muted">{normalizedPath}</p>
                <p className="text-xs text-muted">Check that the file exists and exports a default component</p>
              </div>
            )) as unknown as React.ComponentType,
          }
        }
      })()
    )
  }, [modulePath, normalizedPath])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  )
}

import { cn } from '@/lib/utils'
import {
  Users,
  Shield,
  ClipboardList,
  Zap,
  User,
  Settings as SettingsIcon,
  Key,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  AlertCircle,
  Loader2,
  PawPrint,
  Warehouse,
  Package,
  RefreshCw,
  Clock,
  AlertTriangle,
  Weight,
  BarChart3,
} from 'lucide-react'

// ─── Chart Theme Helpers ─────────────────────────────────────────────────────

const chartColors = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#eab308', '#ef4444']

const baseChartOptions: ApexOptions = {
  chart: {
    fontFamily: 'inherit',
    toolbar: { show: false },
    background: 'transparent',
  },
  theme: { mode: 'light' },
  grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
  tooltip: {
    theme: 'light',
    style: { fontSize: '12px' },
  },
}

// ─── Color Classes ───────────────────────────────────────────────────────────

const colorClasses = {
  blue: {
    gradient: 'from-blue-500 to-blue-400',
    light: 'bg-blue-50 text-blue-600',
    bar: 'bg-gradient-to-r from-blue-500 to-blue-400',
    ring: 'ring-blue-200',
  },
  green: {
    gradient: 'from-emerald-500 to-emerald-400',
    light: 'bg-emerald-50 text-emerald-600',
    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    ring: 'ring-emerald-200',
  },
  purple: {
    gradient: 'from-purple-500 to-purple-400',
    light: 'bg-purple-50 text-purple-600',
    bar: 'bg-gradient-to-r from-purple-500 to-purple-400',
    ring: 'ring-purple-200',
  },
  orange: {
    gradient: 'from-orange-500 to-orange-400',
    light: 'bg-orange-50 text-orange-600',
    bar: 'bg-gradient-to-r from-orange-500 to-orange-400',
    ring: 'ring-orange-200',
  },
  teal: {
    gradient: 'from-teal-500 to-teal-400',
    light: 'bg-teal-50 text-teal-600',
    bar: 'bg-gradient-to-r from-teal-500 to-teal-400',
    ring: 'ring-teal-200',
  },
  pink: {
    gradient: 'from-pink-500 to-pink-400',
    light: 'bg-pink-50 text-pink-600',
    bar: 'bg-gradient-to-r from-pink-500 to-pink-400',
    ring: 'ring-pink-200',
  },
  red: {
    gradient: 'from-red-500 to-red-400',
    light: 'bg-red-50 text-red-600',
    bar: 'bg-gradient-to-r from-red-500 to-red-400',
    ring: 'ring-red-200',
  },
  yellow: {
    gradient: 'from-yellow-500 to-yellow-400',
    light: 'bg-yellow-50 text-yellow-600',
    bar: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
    ring: 'ring-yellow-200',
  },
}

type ColorKey = keyof typeof colorClasses

// ─── Stat Card Component ─────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  value,
  label,
  subtitle,
  color,
  percentage,
}: {
  icon: React.ElementType
  value: number
  label: string
  subtitle?: string
  color: ColorKey
  percentage?: number
}) => {
  const colors = colorClasses[color]
  return (
    <div className="relative bg-surface border border-border rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className={cn('absolute top-0 inset-x-0 h-1 bg-gradient-to-r', colors.gradient)} />
      <div className="flex items-start justify-between mb-4">
        <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl', colors.light)}>
          <Icon className="w-6 h-6" />
        </div>
        {percentage !== undefined && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
            percentage >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          )}>
            {percentage >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{Math.abs(percentage)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-extrabold text-primary tracking-tight mb-0.5">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-muted font-medium">{label}</div>
      {subtitle && <div className="text-xs text-muted/70 mt-1">{subtitle}</div>}
      {percentage !== undefined && (
        <div className="h-1.5 bg-background rounded-full overflow-hidden mt-3">
          <div
            className={cn('h-full rounded-full transition-all duration-700', colors.bar)}
            style={{ width: `${Math.min(Math.abs(percentage), 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Chart Card Wrapper ──────────────────────────────────────────────────────

const ChartCard = ({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn('bg-surface border border-border rounded-2xl p-5 transition-shadow hover:shadow-lg', className)}>
    <h3 className="flex items-center gap-2 text-base font-bold text-primary mb-4">
      {Icon && <Icon className="w-4.5 h-4.5 text-muted" />}
      {title}
    </h3>
    {children}
  </div>
)

// ─── Dashboard Home ──────────────────────────────────────────────────────────

const DashboardHome = () => {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [animalsByType, setAnimalsByType] = useState<AnimalByType[]>([])
  const [animalsBySex, setAnimalsBySex] = useState<AnimalBySex[]>([])
  const [animalsByStatus, setAnimalsByStatus] = useState<AnimalByStatus[]>([])
  const [cageOccupancy, setCageOccupancy] = useState<CageOccupancy[]>([])
  const [inventoryByCategory, setInventoryByCategory] = useState<InventoryByCategory[]>([])
  const [recentAnimals, setRecentAnimals] = useState<RecentAnimal[]>([])
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([])
  const [rationTrends, setRationTrends] = useState<RationTrend[]>([])
  const [stockTrends, setStockTrends] = useState<StockTransactionTrend[]>([])
  const [weightDistribution, setWeightDistribution] = useState<{ range: string; count: number }[]>([])

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [
        statsData,
        typeData,
        sexData,
        statusData,
        cageData,
        inventoryData,
        recentData,
        expiringData,
        rationData,
        stockData,
        weightData,
      ] = await Promise.all([
        dashboardService.getStats(user.id),
        dashboardService.getAnimalsByType(user.id),
        dashboardService.getAnimalsBySex(user.id),
        dashboardService.getAnimalsByStatus(user.id),
        dashboardService.getCageOccupancy(user.id),
        dashboardService.getInventoryByCategory(),
        dashboardService.getRecentAnimals(user.id, 5),
        dashboardService.getExpiringItems(30),
        dashboardService.getRationTrends(),
        dashboardService.getStockTransactionTrends(),
        dashboardService.getAnimalWeightDistribution(user.id),
      ])
      setStats(statsData)
      setAnimalsByType(typeData)
      setAnimalsBySex(sexData)
      setAnimalsByStatus(statusData)
      setCageOccupancy(cageData)
      setInventoryByCategory(inventoryData)
      setRecentAnimals(recentData)
      setExpiringItems(expiringData)
      setRationTrends(rationData)
      setStockTrends(stockData)
      setWeightDistribution(weightData)
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // ── Chart options ──────────────────────────────────────────────────────────

  const animalTypeChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'donut' },
    labels: animalsByType.map((a) => a.type),
    colors: chartColors,
    legend: { position: 'bottom', fontSize: '12px' },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: { show: true, label: 'Total', fontSize: '14px', fontWeight: '700' },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['#fff'] },
  }

  const animalSexChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'pie' },
    labels: animalsBySex.map((a) => a.sex),
    colors: ['#3b82f6', '#ec4899', '#9ca3af'],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: '600' } },
    stroke: { width: 2, colors: ['#fff'] },
  }

  const animalStatusChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'bar' },
    xaxis: { categories: animalsByStatus.map((a) => a.status) },
    colors: ['#22c55e'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '50%', distributed: true },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
  }

  const cageOccupancyChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'bar', stacked: true },
    xaxis: {
      categories: cageOccupancy.slice(0, 10).map((c) => c.label),
      labels: { rotate: -45, style: { fontSize: '11px' } },
    },
    colors: ['#3b82f6', '#e5e7eb'],
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: '60%' },
    },
    dataLabels: { enabled: false },
    legend: { position: 'top' },
    yaxis: { title: { text: 'Count' } },
  }

  const inventoryCategoryChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'bar' },
    xaxis: {
      categories: inventoryByCategory.map((c) => c.category),
      labels: { rotate: -45, style: { fontSize: '11px' } },
    },
    colors: ['#a855f7'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '55%', distributed: true },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    yaxis: {
      title: { text: 'Total Value' },
      labels: {
        formatter: (val: number) => `₱${val.toLocaleString()}`,
      },
    },
    tooltip: {
      y: { formatter: (val: number) => `₱${val.toLocaleString()}` },
    },
  }

  const rationTrendChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'area' },
    xaxis: {
      categories: rationTrends.map((r) => {
        const d = new Date(r.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      }),
      labels: { style: { fontSize: '11px' } },
    },
    colors: ['#22c55e', '#f97316'],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] },
    },
    dataLabels: { enabled: false },
    legend: { position: 'top' },
    yaxis: [
      { title: { text: 'Feedings' } },
      { opposite: true, title: { text: 'Quantity Used' } },
    ],
  }

  const stockTrendChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'bar' },
    xaxis: {
      categories: stockTrends.map((s) => {
        const d = new Date(s.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      }),
      labels: { style: { fontSize: '11px' } },
    },
    colors: ['#3b82f6', '#14b8a6'],
    plotOptions: {
      bar: { borderRadius: 3, columnWidth: '65%' },
    },
    dataLabels: { enabled: false },
    legend: { position: 'top' },
    yaxis: { title: { text: 'Transactions' } },
  }

  const weightDistributionChartOptions: ApexOptions = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'bar' },
    xaxis: { categories: weightDistribution.map((w) => w.range) },
    colors: ['#f97316'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '50%', distributed: true },
    },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: '600' } },
    legend: { show: false },
    yaxis: { title: { text: 'Animals' } },
  }

  // ── Quick links ────────────────────────────────────────────────────────────

  const quickLinks = [
    { to: '/dashboard/profile', icon: User, text: 'User Profile', description: 'View and edit your profile', color: 'green' as const },
    { to: '/dashboard/facilities', icon: ClipboardList, text: 'Facilities', description: 'Manage facilities', color: 'purple' as const },
    { to: '/dashboard/dynamic', icon: Zap, text: 'Modules', description: 'Configure modules', color: 'orange' as const },
    { to: '/dashboard/rbac', icon: Shield, text: 'Roles', description: 'Manage roles & permissions', color: 'blue' as const },
    { to: '/dashboard/user-management', icon: Users, text: 'Users', description: 'Manage system users', color: 'teal' as const },
    { to: '/dashboard/user-activation', icon: Key, text: 'Activation', description: 'Activate/deactivate users', color: 'pink' as const },
  ]

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-success animate-spin mx-auto mb-4" />
          <p className="text-muted font-medium">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  const s = stats || {
    totalAnimals: 0, activeAnimals: 0, totalCages: 0, cageOccupancy: 0,
    inventoryItems: 0, lowStockItems: 0, pendingRequests: 0,
    totalUsers: 0, activeUsers: 0, totalFacilities: 0, totalRoles: 0, totalModules: 0,
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted text-sm mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.username || 'User'}</span>! Here's your farm at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-primary hover:border-success transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-muted font-medium">
            <Calendar className="w-4 h-4 text-success" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── KPI Stats Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <StatCard icon={PawPrint} value={s.totalAnimals} label="Total Animals" subtitle={`${s.activeAnimals} active`} color="green" percentage={s.totalAnimals > 0 ? Math.round((s.activeAnimals / s.totalAnimals) * 100) : 0} />
        <StatCard icon={Warehouse} value={s.totalCages} label="Cages" subtitle={`${s.cageOccupancy}% occupied`} color="blue" percentage={s.cageOccupancy} />
        <StatCard icon={Package} value={s.inventoryItems} label="Inventory Items" subtitle={s.lowStockItems > 0 ? `${s.lowStockItems} low stock` : 'Stock levels healthy'} color="purple" percentage={s.inventoryItems > 0 ? 100 - Math.round((s.lowStockItems / s.inventoryItems) * 100) : 100} />
        <StatCard icon={AlertCircle} value={s.pendingRequests} label="Pending Requests" subtitle="Awaiting approval" color="orange" />
        <StatCard icon={Users} value={s.totalUsers} label="Total Users" subtitle={`${s.activeUsers} confirmed`} color="teal" percentage={s.totalUsers > 0 ? Math.round((s.activeUsers / s.totalUsers) * 100) : 0} />
        <StatCard icon={ClipboardList} value={s.totalFacilities} label="Facilities" color="pink" />
        <StatCard icon={Shield} value={s.totalRoles} label="Active Roles" color="red" />
        <StatCard icon={Zap} value={s.totalModules} label="Modules" color="yellow" />
      </div>

      {/* ── Charts Row 1: Animal Analytics ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Animals by Type" icon={PawPrint}>
          {animalsByType.length > 0 ? (
            <Chart
              options={animalTypeChartOptions}
              series={animalsByType.map((a) => a.count)}
              type="donut"
              height={280}
            />
          ) : (
            <EmptyState message="No animal data available" />
          )}
        </ChartCard>

        <ChartCard title="Animals by Sex" icon={PawPrint}>
          {animalsBySex.length > 0 ? (
            <Chart
              options={animalSexChartOptions}
              series={animalsBySex.map((a) => a.count)}
              type="pie"
              height={280}
            />
          ) : (
            <EmptyState message="No animal data available" />
          )}
        </ChartCard>

        <ChartCard title="Animals by Status" icon={Activity}>
          {animalsByStatus.length > 0 ? (
            <Chart
              options={animalStatusChartOptions}
              series={[{ name: 'Animals', data: animalsByStatus.map((a) => a.count) }]}
              type="bar"
              height={280}
            />
          ) : (
            <EmptyState message="No status data available" />
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2: Operations ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Cage Occupancy" icon={Warehouse}>
          {cageOccupancy.length > 0 ? (
            <Chart
              options={cageOccupancyChartOptions}
              series={[
                { name: 'Occupied', data: cageOccupancy.slice(0, 10).map((c) => c.occupied) },
                { name: 'Available', data: cageOccupancy.slice(0, 10).map((c) => Math.max(c.capacity - c.occupied, 0)) },
              ]}
              type="bar"
              height={300}
            />
          ) : (
            <EmptyState message="No cage data available" />
          )}
        </ChartCard>

        <ChartCard title="Inventory Value by Category" icon={Package}>
          {inventoryByCategory.length > 0 ? (
            <Chart
              options={inventoryCategoryChartOptions}
              series={[{ name: 'Total Value', data: inventoryByCategory.map((c) => c.totalValue) }]}
              type="bar"
              height={300}
            />
          ) : (
            <EmptyState message="No inventory data available" />
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 3: Trends ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Feeding Trends (14 Days)" icon={BarChart3}>
          {rationTrends.length > 0 ? (
            <Chart
              options={rationTrendChartOptions}
              series={[
                { name: 'Feedings', data: rationTrends.map((r) => r.count) },
                { name: 'Qty Used', data: rationTrends.map((r) => r.totalQuantity) },
              ]}
              type="area"
              height={280}
            />
          ) : (
            <EmptyState message="No feeding data available" />
          )}
        </ChartCard>

        <ChartCard title="Stock Transactions (14 Days)" icon={BarChart3}>
          {stockTrends.length > 0 ? (
            <Chart
              options={stockTrendChartOptions}
              series={[
                { name: 'Requests', data: stockTrends.map((s) => s.requests) },
                { name: 'Returns', data: stockTrends.map((s) => s.returns) },
              ]}
              type="bar"
              height={280}
            />
          ) : (
            <EmptyState message="No transaction data available" />
          )}
        </ChartCard>
      </div>

      {/* ── Weight Distribution ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Weight Distribution" icon={Weight}>
          {weightDistribution.some((w) => w.count > 0) ? (
            <Chart
              options={weightDistributionChartOptions}
              series={[{ name: 'Animals', data: weightDistribution.map((w) => w.count) }]}
              type="bar"
              height={260}
            />
          ) : (
            <EmptyState message="No weight data available" />
          )}
        </ChartCard>

        {/* ── Recent Animals Table ───────────────────────────────────────── */}
        <ChartCard title="Recently Added Animals" icon={PawPrint} className="lg:col-span-2">
          {recentAnimals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Tag</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Sex</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Weight</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnimals.map((animal) => (
                    <tr key={animal.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-primary">{animal.tagCode}</td>
                      <td className="py-2.5 px-3 text-foreground">{animal.animalType}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          animal.sex === 'Male' ? 'bg-blue-50 text-blue-700' : animal.sex === 'Female' ? 'bg-pink-50 text-pink-700' : 'bg-gray-50 text-gray-700'
                        )}>
                          {animal.sex}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-foreground">{animal.weight} kg</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          animal.status === 'Healthy' ? 'bg-emerald-50 text-emerald-700' :
                          animal.status === 'Sick' ? 'bg-red-50 text-red-700' :
                          'bg-yellow-50 text-yellow-700'
                        )}>
                          {animal.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(animal.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No recent animals" />
          )}
        </ChartCard>
      </div>

      {/* ── Bottom Row: Expiring Items + Quick Actions ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* Expiring Inventory */}
        <ChartCard title="Expiring Inventory (30 Days)" icon={AlertTriangle}>
          {expiringItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Item</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Qty</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Expiry</th>
                    <th className="text-left py-2.5 px-3 text-muted font-semibold text-xs uppercase tracking-wider">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground max-w-[200px] truncate">{item.description}</td>
                      <td className="py-2.5 px-3 text-muted">{item.category}</td>
                      <td className="py-2.5 px-3 text-foreground">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-foreground text-xs">{new Date(item.expiryDate).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                          item.daysUntilExpiry <= 0 ? 'bg-red-100 text-red-700' :
                          item.daysUntilExpiry <= 7 ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        )}>
                          {item.daysUntilExpiry <= 0 ? 'Expired' : `${item.daysUntilExpiry}d`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-primary">All Clear!</p>
              <p className="text-xs text-muted mt-1">No items expiring in the next 30 days</p>
            </div>
          )}
        </ChartCard>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-primary">
              <SettingsIcon className="w-4.5 h-4.5 text-muted" />
              Quick Actions
            </h3>
            <span className="px-2.5 py-1 bg-background rounded-full text-xs font-semibold text-muted">
              {quickLinks.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {quickLinks.map((link, i) => {
              const Icon = link.icon
              const colors = colorClasses[link.color]
              return (
                <Link
                  key={i}
                  to={link.to}
                  className="flex items-center gap-3.5 p-3.5 bg-surface border border-border rounded-xl hover:border-success hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group"
                >
                  <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', colors.light)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground truncate">{link.text}</span>
                    <span className="block text-xs text-muted truncate">{link.description}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-success group-hover:translate-x-1 transition-all" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty State Component ───────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
      <BarChart3 className="w-5 h-5 text-gray-400" />
    </div>
    <p className="text-sm text-muted">{message}</p>
  </div>
)

// Component Registry for dynamic routes
const componentRegistry: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'views/rbac/UserActivation': lazy(() => import('@/views/rbac/UserActivation')),
  'views/rbac/RoleManagement': lazy(() => import('@/views/rbac/RoleManagement')),
  'views/rbac/UserManagement': lazy(() => import('@/views/rbac/UserManagement')),
  'views/rbac/ModuleManagement': lazy(() => import('@/views/rbac/ModuleManagement')),
  'views/rbac/FacilitiesManagement': lazy(() => import('@/views/rbac/FacilitiesManagement')),
  // Legacy static registry - for RBAC modules only
  // Animal modules and new modules are loaded dynamically via file path
}

const Dashboard = () => {
  const { userModules } = useRBAC()
  
  // Get dynamic routes from all modules
  const dynamicRoutes = userModules.map(module => {
    const basePath = module.route_path.replace(/^\/dashboard/, '')
    const normalizedPath = module.file_path?.replace(/\\/g, '/') || ''
    
    // Check if this is a legacy RBAC module in the registry
    const isLegacyModule = normalizedPath in componentRegistry
    
    return {
      path: basePath,
      type: isLegacyModule ? ('registry' as const) : ('dynamic' as const),
      filePath: module.file_path,
      registryKey: normalizedPath,
    }
  })

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Dynamic routes from database modules */}
        {dynamicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.type === 'registry' ? (
                // Legacy module from registry
                <Suspense fallback={<LoadingFallback />}>
                  {(() => {
                    const Component = componentRegistry[route.registryKey]
                    return <Component />
                  })()}
                </Suspense>
              ) : (
                // New dynamic module loaded from file path
                // Use filePath as key to force remount when route changes
                <DynamicComponentLoader key={route.filePath} filePath={route.filePath || ''} />
              )
            }
          />
        ))}
      </Routes>
    </Layout>
  )
}

export default Dashboard
