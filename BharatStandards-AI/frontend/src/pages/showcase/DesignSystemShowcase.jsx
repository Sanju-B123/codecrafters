import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Plus,
  Compass,
  ArrowRight,
  Sparkles,
  Download,
  Trash2,
  Info
} from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
  Breadcrumb,
  Pagination,
  Progress,
  Skeleton,
  StatCard,
  PageHeader,
  SectionHeader,
  DataTable,
  Dialog,
  Drawer,
  Dropdown,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Tooltip,
  useToast,
  Alert,
  EmptyState,
  ErrorState,
  LoadingState
} from '@/components/ui';

export const DesignSystemShowcase = () => {
  const { addToast } = useToast();

  // State for interactive overlays
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [selectedRadio, setSelectedRadio] = useState('scheme1');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState('clause');
  const [sortDir, setSortDir] = useState('asc');

  // Sample Table Data
  const sampleTableData = [
    { id: '1', clause: 'Clause 6.1', title: 'Dielectric Strength & Voltage Withstand', category: 'Safety', status: 'PASS' },
    { id: '2', clause: 'Clause 8.4', title: 'Hydraulic Proof Pressure Test (1.6 MPa)', category: 'Testing', status: 'MISSING' },
    { id: '3', clause: 'Clause 12.2', title: 'Thermal Cut-out Safety Interlock (90°C)', category: 'Safety', status: 'MISSING' },
    { id: '4', clause: 'Clause 14.1', title: 'Rating Plate Marking & ISI Monogram', category: 'Marking', status: 'PARTIAL' },
    { id: '5', clause: 'Clause 16.3', title: 'Standing Heat Loss Energy Efficiency', category: 'Performance', status: 'PASS' },
  ];

  const tableColumns = [
    { key: 'clause', label: 'Clause', sortable: true },
    { key: 'title', label: 'Requirement Title', sortable: true },
    { key: 'category', label: 'Domain Category', sortable: true },
    {
      key: 'status',
      label: 'Readiness Status',
      sortable: false,
      render: (val) => <StatusBadge status={val} size="sm" />,
    },
  ];

  return (
    <div className="space-y-12 pb-20 text-left max-w-7xl mx-auto">
      {/* Top Header & Theme Switcher */}
      <PageHeader
        title="GovTech Design System & Component Showcase"
        subtitle="Authoritative UI/UX foundation for BharatStandards AI. Designed for trust, high contrast compliance clarity, accessibility, and robust GovTech aesthetics."
        badge={
          <Badge variant="saffron" size="sm">
            Interactive Style Guide
          </Badge>
        }
        breadcrumbs={[
          { label: 'Console', href: '/dashboard' },
          { label: 'UI/UX Design System' },
        ]}
        actions={
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Normal Mode (Active)</span>
          </div>
        }
      />

      {/* Tabs organizing the design system */}
      <Tabs defaultValue="statuses">
        <TabList variant="pills">
          <TabTrigger value="statuses" variant="pills">
            1. Compliance Status System
          </TabTrigger>
          <TabTrigger value="buttons-forms" variant="pills">
            2. Buttons & Form Controls
          </TabTrigger>
          <TabTrigger value="data-cards" variant="pills">
            3. Cards & Data Display
          </TabTrigger>
          <TabTrigger value="feedback-overlays" variant="pills">
            4. Overlays & Feedback
          </TabTrigger>
        </TabList>

        {/* TAB 1: COMPLIANCE STATUS SYSTEM */}
        <TabContent value="statuses" className="space-y-8 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Accessible Status System (Icon + Text Dual Encoding)</CardTitle>
              <CardDescription>
                Mandatory accessibility rule: statuses never rely on color alone. Each status badge communicates meaning simultaneously through high-contrast coloration, dedicated Lucide iconography, and explicit text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compliance Evaluation Statuses */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Compliance Audit Statuses (PASS / PARTIAL / MISSING)
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status="PASS" size="lg" />
                  <StatusBadge status="PASS" size="md" />
                  <StatusBadge status="PASS" size="sm" />

                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

                  <StatusBadge status="PARTIAL" size="lg" />
                  <StatusBadge status="PARTIAL" size="md" />
                  <StatusBadge status="PARTIAL" size="sm" />

                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

                  <StatusBadge status="MISSING" size="lg" />
                  <StatusBadge status="MISSING" size="md" />
                  <StatusBadge status="MISSING" size="sm" />
                </div>
              </div>

              {/* Priority & Urgency Levels */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Gap Urgency Levels (HIGH / MEDIUM / LOW)
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status="HIGH" size="md" />
                  <StatusBadge status="MEDIUM" size="md" />
                  <StatusBadge status="LOW" size="md" />
                </div>
              </div>

              {/* Operational / Async Statuses */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pipeline & Processing Statuses (PROCESSING / COMPLETED / FAILED)
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status="PROCESSING" size="md" />
                  <StatusBadge status="COMPLETED" size="md" />
                  <StatusBadge status="FAILED" size="md" />
                </div>
              </div>

              {/* General Categorical Badges */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Categorical & Sector Badges
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">Scheme-I ISI Mark</Badge>
                  <Badge variant="navy">ETD Division 32</Badge>
                  <Badge variant="saffron">Mandatory QCO</Badge>
                  <Badge variant="neutral">ISO 9001:2015</Badge>
                  <Badge variant="outline">NABL Accredited</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* TAB 2: BUTTONS & FORM CONTROLS */}
        <TabContent value="buttons-forms" className="space-y-8 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Button Variations */}
            <Card>
              <CardHeader>
                <CardTitle>Button Hierarchy & Variants</CardTitle>
                <CardDescription>
                  Consistent tactile buttons with distinct visual hierarchy, loading states, and icon slots.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Button</Button>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block">Button Sizes</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="xs" variant="secondary">Size XS</Button>
                    <Button size="sm" variant="secondary">Size SM</Button>
                    <Button size="md" variant="primary">Size MD</Button>
                    <Button size="lg" variant="primary">Size LG</Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block">States & Icons</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button startIcon={<Plus className="w-4 h-4" />}>Add Item</Button>
                    <Button variant="outline" endIcon={<ArrowRight className="w-4 h-4" />}>Continue</Button>
                    <Button loading>Processing</Button>
                    <Button disabled>Disabled Action</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Form Controls & Validations</CardTitle>
                <CardDescription>
                  Accessible form elements with labels, helper text, error messages, and adornments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Product Commercial Name"
                  required
                  placeholder="e.g. Electric Storage Water Heater"
                  helperText="Enter official commercial model name under evaluation."
                />

                <Input
                  label="Search Standards Catalog"
                  startIcon={<Search className="w-4 h-4" />}
                  placeholder="Filter by IS code (e.g. IS 2082)..."
                />

                <Input
                  label="Factory Testing Pressure (MPa)"
                  defaultValue="0.4"
                  error="Proof test pressure must be at least 1.6 MPa per Clause 8.4."
                />

                <Select
                  label="Industry Division"
                  required
                  options={[
                    { value: 'etd', label: 'Electrotechnical Division (ETD)' },
                    { value: 'med', label: 'Mechanical Engineering Division (MED)' },
                    { value: 'chd', label: 'Chemical Division (CHD)' },
                  ]}
                />

                <Textarea
                  label="Product Technical Description"
                  rows={2}
                  placeholder="Summarize wattage, tank capacity, insulation, and earthing scheme..."
                />

                <div className="pt-2 flex flex-col gap-3">
                  <Checkbox
                    label="Mandatory Quality Control Order (QCO) Verification"
                    description="Confirm this product model falls under government gazette notification."
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                  />

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Conformity Assessment Scheme
                    </span>
                    <Radio
                      name="scheme"
                      value="scheme1"
                      label="Scheme-I: Product Certification (ISI Mark)"
                      description="Requires factory inspection and independent laboratory testing."
                      checked={selectedRadio === 'scheme1'}
                      onChange={() => setSelectedRadio('scheme1')}
                    />
                    <Radio
                      name="scheme"
                      value="scheme2"
                      label="Scheme-II: Compulsory Registration Scheme (CRS)"
                      description="Self-declaration of conformity for electronics and IT goods."
                      checked={selectedRadio === 'scheme2'}
                      onChange={() => setSelectedRadio('scheme2')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabContent>

        {/* TAB 3: CARDS & DATA DISPLAY */}
        <TabContent value="data-cards" className="space-y-8 pt-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Compliance Readiness"
              value="78%"
              subtitle="20 Requirements Audited"
              trend="up"
              trendLabel="+12% from last upload"
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Satisfied Clauses"
              value="15 PASS"
              subtitle="Fully substantiated"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Open Deficiencies"
              value="2 MISSING"
              subtitle="Critical lab test gaps"
              trend="down"
              trendLabel="Requires action"
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              title="Active Standard"
              value="DEMO-IS-001"
              subtitle="Electric Water Heater"
              icon={<Compass className="w-5 h-5 text-bharat-700" />}
            />
          </div>

          {/* Data Table */}
          <div className="space-y-3">
            <SectionHeader
              title="Requirements Conformance Matrix"
              subtitle="Live interactive table with sortable columns, row highlights, and status badges."
              badge={<Badge variant="neutral">5 Sample Rows</Badge>}
            />
            <DataTable
              columns={tableColumns}
              data={sampleTableData}
              sortColumn={sortCol}
              sortDirection={sortDir}
              onSort={(col) => {
                if (sortCol === col) {
                  setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortCol(col);
                  setSortDir('asc');
                }
              }}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={3}
              totalItems={15}
              itemsPerPage={5}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Progress Indicators & Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Progress Gauges</CardTitle>
                <CardDescription>
                  Continuous and multi-segmented progress indicators for audit transparency.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Progress value={78} showLabel label="Overall Audit Readiness" size="lg" />

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Segmented Breakdown (15 Pass • 3 Partial • 2 Missing)</span>
                    <span>20 Clauses</span>
                  </div>
                  <Progress
                    max={20}
                    size="md"
                    segments={[
                      { value: 15, className: 'bg-emerald-500', title: '15 Pass' },
                      { value: 3, className: 'bg-amber-400', title: '3 Partial' },
                      { value: 2, className: 'bg-rose-500', title: '2 Missing' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avatars & Skeletons</CardTitle>
                <CardDescription>
                  Content loading pulse animations and user presence avatars.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar size="xs" fallback="RV" status="online" />
                  <Avatar size="sm" fallback="RV" status="online" />
                  <Avatar size="md" fallback="RV" status="busy" />
                  <Avatar size="lg" fallback="RV" status="away" />
                  <Avatar size="xl" fallback="RV" status="offline" />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" variant="rectangular" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabContent>

        {/* TAB 4: OVERLAYS & FEEDBACK */}
        <TabContent value="feedback-overlays" className="space-y-8 pt-4">
          {/* Triggers Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Modals, Drawers & Menus</CardTitle>
              <CardDescription>
                Click each button to test accessible dialogs, slide-overs, dropdowns, and toast notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setDialogOpen(true)} variant="primary">
                Open Dialog Modal
              </Button>

              <Button onClick={() => setDrawerOpen(true)} variant="secondary">
                Open Slide Drawer
              </Button>

              <Dropdown
                trigger={<Button variant="outline">Action Menu ▾</Button>}
                items={[
                  { label: 'Download Audit Dossier', icon: <Download className="w-4 h-4" /> },
                  { label: 'Run AI Re-analysis', icon: <Sparkles className="w-4 h-4" /> },
                  { type: 'divider' },
                  { label: 'Archive Product', icon: <Trash2 className="w-4 h-4" />, danger: true },
                ]}
              />

              <Tooltip content="Verified against BIS Gazette Order ETD 32">
                <Button variant="ghost">Hover for Tooltip</Button>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Toasts Triggers */}
          <Card>
            <CardHeader>
              <CardTitle>Toast Notification Triggers</CardTitle>
              <CardDescription>
                Trigger accessible notifications that auto-dismiss or can be closed manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'success',
                    title: 'Document Ingestion Complete',
                    message: 'Hydrostatic test report successfully parsed with 6 extracted clauses.',
                  })
                }
              >
                Trigger Success Toast
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'error',
                    title: 'Compliance Gap Detected',
                    message: 'Missing proof pressure certification for Clause 8.4.',
                  })
                }
              >
                Trigger Error Toast
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'warning',
                    title: 'Audit Renewal Window',
                    message: 'Your pre-grant factory inspection requires scheduling within 30 days.',
                  })
                }
              >
                Trigger Warning Toast
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'info',
                    title: 'New Standard Gazette Published',
                    message: 'BIS has published Amendment 3 to IS 2082.',
                  })
                }
              >
                Trigger Info Toast
              </Button>
            </CardContent>
          </Card>

          {/* Alert Banners */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Inline Alerts</h3>
            <Alert variant="info" title="Official Gazette Notice">
              All stationary storage water heaters manufactured or imported after October 2026 must bear the Standard Mark under BIS Scheme-I.
            </Alert>
            <Alert variant="success" title="Laboratory Evidence Verified">
              Dielectric voltage withstand test certificate from NABL lab matches all requirements of Clause 6.1.
            </Alert>
            <Alert variant="warning" title="Partial Documentation">
              Rating plate drawing lacks mandatory BIS website hyperlink placeholder.
            </Alert>
            <Alert variant="destructive" title="Critical Non-Conformance">
              No evidence provided for independent 90°C thermal cut-out safety switch.
            </Alert>
          </div>

          {/* Empty & Error States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              title="No test reports uploaded"
              description="Upload your NABL laboratory test results to initiate automated compliance readiness check."
              action={<Button size="sm">Upload Report PDF</Button>}
            />
            <ErrorState
              title="Failed to fetch standards index"
              message="Network timeout while connecting to authoritative standards service."
              onRetry={() => alert('Retrying connection...')}
            />
          </div>

          {/* Loading State */}
          <Card>
            <CardContent>
              <LoadingState
                message="Vectorizing document chunks..."
                description="Extracting clause citations and checking embeddings against Indian Standards database."
              />
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* Interactive Modal Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Confirm Compliance Re-Audit"
        description="Initiating a re-audit will evaluate all 20 requirements against freshly uploaded documents in the vault."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This operation will recalculate your compliance readiness percentage and update open gap priority cards.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDialogOpen(false);
                addToast({
                  type: 'success',
                  title: 'Audit In Progress',
                  message: 'Compliance calculation completed with score 78%.',
                });
              }}
            >
              Confirm Re-Audit
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Interactive Slide Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Clause 8.4 Inspection Detail"
        description="Standard: DEMO-IS-001 (Hydrostatic Pressure Proof Test)"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900 text-xs">
            <StatusBadge status="MISSING" size="sm" className="mb-2" />
            <p className="text-slate-800 dark:text-slate-200">
              The uploaded test report only recorded 0.8 MPa. Clause 8.4 explicitly mandates 2x rated pressure (1.6 MPa) held for 15 minutes.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Required Remediation:</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Obtain calibrated transducer test log at 1.6 MPa from an accredited NABL lab with photographic proof.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button size="sm" onClick={() => setDrawerOpen(false)}>
              Close Panel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
