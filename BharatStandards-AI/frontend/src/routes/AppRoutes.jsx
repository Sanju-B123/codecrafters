import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

// Pages
import { LandingPage } from '@/pages/landing/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ConsumerDashboardPage } from '@/pages/dashboard/ConsumerDashboardPage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { NewProductPage } from '@/pages/products/NewProductPage';
import { ProductDetailPage } from '@/pages/products/ProductDetailPage';
import { EditProductPage } from '@/pages/products/EditProductPage';
import { StandardsPage } from '@/pages/standards/StandardsPage';
import { StandardDetailPage } from '@/pages/standards/StandardDetailPage';
import { DocumentsPage } from '@/pages/documents/DocumentsPage';
import { DocumentDetailPage } from '@/pages/documents/DocumentDetailPage';
import { CompliancePage } from '@/pages/compliance/CompliancePage';
import { ComplianceDetailPage } from '@/pages/compliance/ComplianceDetailPage';
import { AssistantPage } from '@/pages/assistant/AssistantPage';
import { ServicesPage } from '@/pages/services/ServicesPage';
import { ServiceDetailPage } from '@/pages/services/ServiceDetailPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { ReportDetailPage } from '@/pages/reports/ReportDetailPage';
import { ActivityPage } from '@/pages/activity/ActivityPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { DesignSystemShowcase } from '@/pages/showcase/DesignSystemShowcase';

// Admin System Pages & Layouts
import { AdminRoute } from '@/routes/AdminRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AccessDeniedPage } from '@/pages/error/AccessDeniedPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminStandardsPage } from '@/pages/admin/AdminStandardsPage';
import { AdminStandardDetailPage } from '@/pages/admin/AdminStandardDetailPage';
import { AdminRequirementsPage } from '@/pages/admin/AdminRequirementsPage';
import { AdminDocumentsPage } from '@/pages/admin/AdminDocumentsPage';
import { AdminServicesPage } from '@/pages/admin/AdminServicesPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminAuditPage } from '@/pages/admin/AdminAuditPage';
import { AdminHealthPage } from '@/pages/admin/AdminHealthPage';
import { AdminKnowledgeImportPage } from '@/pages/admin/AdminKnowledgeImportPage';
import { AdminKnowledgeReviewPage } from '@/pages/admin/AdminKnowledgeReviewPage';
import { AdminKnowledgePage } from '@/pages/admin/AdminKnowledgePage';
import { AdminKnowledgeSourcesPage } from '@/pages/admin/AdminKnowledgeSourcesPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 403 Forbidden Access Denied Page */}
      <Route path="/403" element={<AccessDeniedPage />} />

      {/* Consumer Authenticated Portal */}
      <Route
        path="/consumer-dashboard"
        element={
          <ProtectedRoute>
            <ConsumerDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Enterprise Console / Industry Dashboard Layout (Protected) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Products */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<NewProductPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/edit" element={<EditProductPage />} />

        {/* Standards */}
        <Route path="/standards" element={<StandardsPage />} />
        <Route path="/standards/:id" element={<StandardDetailPage />} />

        {/* Documents */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />

        {/* Compliance */}
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/compliance/:id" element={<ComplianceDetailPage />} />
        <Route path="/compliance/:id/report" element={<ReportDetailPage />} />

        {/* AI Copilot Assistant */}
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/assistant/product/:productId" element={<AssistantPage />} />

        {/* BIS Services & Guidance */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/products/:productId/services" element={<ServicesPage />} />
        <Route path="/bis-services" element={<Navigate to="/services" replace />} />

        {/* Reports */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />

        {/* Activity Log & Audit Trail */}
        <Route path="/activity" element={<ActivityPage />} />

        {/* User Account */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Design System Style Showcase */}
        <Route path="/design-system" element={<DesignSystemShowcase />} />
      </Route>

      {/* Dedicated Administrative Governance Portal (Strict Admin Protected) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="standards" element={<AdminStandardsPage />} />
        <Route path="standards/:id" element={<AdminStandardDetailPage />} />
        <Route path="requirements" element={<AdminRequirementsPage />} />
        <Route path="knowledge" element={<AdminKnowledgePage />} />
        <Route path="knowledge/import" element={<AdminKnowledgeImportPage />} />
        <Route path="knowledge/review" element={<AdminKnowledgeReviewPage />} />
        <Route path="knowledge/sources" element={<AdminKnowledgeSourcesPage />} />
        <Route path="documents" element={<AdminDocumentsPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="health" element={<AdminHealthPage />} />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

