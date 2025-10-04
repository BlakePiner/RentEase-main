// file: App.tsx
import { useEffect, lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

// Guards
import { AuthRedirectRoute, ProtectedRoute } from "./Guard";

// Store + API
import { useAuthStore } from "./stores/useAuthStore";
import {
  checkAuthStatusRequest,
  refreshTokenRequest,
  getUserInfoRequest,
} from "./api/authApi";
import UnitDetails from "./pages/private/landlord/property/UnitDetails";

// ------------------------------- Lazy Imports
// Layouts
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const LandlordLayout = lazy(() => import("./layouts/LandlordLayout"));
const TenantLayout = lazy(() => import("./layouts/TenantLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));

// Public pages
const Landing = lazy(() => import("./pages/public/Landing"));
const About = lazy(() => import("./pages/public/About"));
const Features = lazy(() => import("./pages/public/Features"));

// Authentication pages
const Register = lazy(() => import("./pages/authentication/Register"));
const Login = lazy(() => import("./pages/authentication/Login"));
const ForgotPassword = lazy(
  () => import("./pages/authentication/ForgotPassword")
);
const ResetPassword = lazy(
  () => import("./pages/authentication/ResetPassword")
);
const VerifyEmail = lazy(() => import("./pages/authentication/VerifyEmail"));
const Onboarding = lazy(() => import("./pages/authentication/Onboarding"));

// Private pages - Landlord
const LandlordDashboard = lazy(
  () => import("./pages/private/landlord/LandlordDashboard")
);
const CreateProperty = lazy(
  () => import("./pages/private/landlord/property/CreateProperty")
);
const EditProperty = lazy(
  () => import("./pages/private/landlord/property/EditProperty")
);
const DisplayProperty = lazy(
  () => import("./pages/private/landlord/property/DisplayAllProperties")
);
const PropertyDetails = lazy(
  () => import("./pages/private/landlord/property/property-details/PropertyDetails")
);
const AddUnit = lazy(() => import("./pages/private/landlord/property/AddUnit"));
const EditUnit = lazy(() => import("./pages/private/landlord/property/EditUnit"));

// Lease pages
const Leases = lazy(() => import("./pages/private/landlord/Leases"));
const LeaseDetails = lazy(() => import("./pages/private/landlord/lease/LeaseDetails"));
const CreateLease = lazy(() => import("./pages/private/landlord/lease/CreateLease"));
const EditLease = lazy(() => import("./pages/private/landlord/lease/EditLease"));

// Maintenance pages
const Maintenance = lazy(() => import("./pages/private/landlord/Maintenance"));
const MaintenanceDetails = lazy(() => import("./pages/private/landlord/maintenance/MaintenanceDetails"));

// Tenant management pages
const Tenants = lazy(() => import("./pages/private/landlord/TenantsRefined"));
const TenantDetails = lazy(() => import("./pages/private/landlord/tenant/TenantDetails"));
const BehaviorReport = lazy(() => import("./pages/private/landlord/tenant/BehaviorReport"));

// Private pages - Tenant
const TenantDashboard = lazy(
  () => import("./pages/private/tenant/TenantDashboard")
);
const MyLease = lazy(
  () => import("./pages/private/tenant/MyLease")
);
const TenantPayments = lazy(
  () => import("./pages/private/tenant/Payments")
);
const TenantMaintenance = lazy(
  () => import("./pages/private/tenant/Maintenance")
);
const BrowseProperties = lazy(
  () => import("./pages/private/tenant/BrowseProperties")
);
const TenantPropertyDetails = lazy(
  () => import("./pages/private/tenant/PropertyDetails")
);

// Private pages - Admin
const AdminDashboard = lazy(
  () => import("./pages/private/admin/AdminDashboard")
);
const PropertyRequests = lazy(
  () => import("./pages/private/admin/PropertyRequests")
);
const AllUsers = lazy(
  () => import("./pages/private/admin/AllUsers")
);
const AdminLandlords = lazy(
  () => import("./pages/private/admin/AdminLandlords")
);
const AdminTenants = lazy(
  () => import("./pages/private/admin/AdminTenants")
);
const Verifications = lazy(
  () => import("./pages/private/admin/Verifications")
);

// Shared private pages
const AccountProfile = lazy(() => import("./pages/private/AccountProfile"));
const Messages = lazy(() => import("./pages/private/Messages"));

// Payment pages
const Payments = lazy(() => import("./pages/private/landlord/Payments"));
const PaymentDetails = lazy(() => import("./pages/private/landlord/payment/PaymentDetails"));
const LeasePaymentHistory = lazy(() => import("./pages/private/landlord/payment/LeasePaymentHistory"));
const PaymentReports = lazy(() => import("./pages/private/landlord/payment/PaymentReports"));

// Financial pages
const Financials = lazy(() => import("./pages/private/landlord/Financials"));

// Reports pages
const Reports = lazy(() => import("./pages/private/landlord/Reports"));

// Fallbacks
const NotFound = lazy(() => import("./pages/fallbacks/NotFound"));
const Unauthorized = lazy(() => import("./pages/fallbacks/Unauthorized"));
const DisabledAccount = lazy(() => import("./pages/fallbacks/DisabledAccount"));

// ------------------------------- Loader Component
const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    <span className="ml-3 text-gray-600 font-medium">Loading…</span>
  </div>
);

// ------------------------------- ROUTES SETUP
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<Loader />}>
        <PublicLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loader />}>
            <Landing />
          </Suspense>
        ),
      },
      {
        path: "about",
        element: (
          <Suspense fallback={<Loader />}>
            <About />
          </Suspense>
        ),
      },
      {
        path: "features",
        element: (
          <Suspense fallback={<Loader />}>
            <Features />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "auth",
    children: [
      {
        path: "register",
        element: (
          <AuthRedirectRoute>
            <Suspense fallback={<Loader />}>
              <Register />
            </Suspense>
          </AuthRedirectRoute>
        ),
      },
      {
        path: "login",
        element: (
          <AuthRedirectRoute>
            <Suspense fallback={<Loader />}>
              <Login />
            </Suspense>
          </AuthRedirectRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <AuthRedirectRoute>
            <Suspense fallback={<Loader />}>
              <ForgotPassword />
            </Suspense>
          </AuthRedirectRoute>
        ),
      },
      {
        path: "reset-password/:token",
        element: (
          <Suspense fallback={<Loader />}>
            <ResetPassword />
          </Suspense>
        ),
      },
      {
        path: "verify-email/:token",
        element: (
          <Suspense fallback={<Loader />}>
            <VerifyEmail />
          </Suspense>
        ),
      },
      {
        path: "onboarding",
        element: (
            <Suspense fallback={<Loader />}>
              <Onboarding />
            </Suspense>
        ),
      },
    ],
  },
  {
    path: "landlord",
    element: (
      <ProtectedRoute allowedRoles={["LANDLORD"]}>
        <Suspense fallback={<Loader />}>
          <LandlordLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loader />}>
            <LandlordDashboard />
          </Suspense>
        ),
      },
      {
        path: "properties",
        element: (
          <Suspense fallback={<Loader />}>
            <DisplayProperty />
          </Suspense>
        ),
      },
      {
        path: "properties/:propertyId",
        element: (
          <Suspense fallback={<Loader />}>
            <PropertyDetails />
          </Suspense>
        ),
      },
      {
        path: "properties/create",
        element: (
          <Suspense fallback={<Loader />}>
            <CreateProperty />
          </Suspense>
        ),
      },
      {
        path: "properties/:propertyId/edit",
        element: (
          <Suspense fallback={<Loader />}>
            <EditProperty />
          </Suspense>
        ),
      },
      {
        path: "properties/:propertyId/units/create",
        element: (
          <Suspense fallback={<Loader />}>
            <AddUnit />
          </Suspense>
        ),
      },
      {
         path: "properties/:propertyId/units/:unitId",
        element: (
          <Suspense fallback={<Loader />}>
            <UnitDetails />
          </Suspense>
        ),
      },
      {
        path: "properties/:propertyId/units/:unitId/edit",
        element: (
          <Suspense fallback={<Loader />}>
            <EditUnit />
          </Suspense>
        ),
      },
      {
        path: "leases",
        element: (
          <Suspense fallback={<Loader />}>
            <Leases />
          </Suspense>
        ),
      },
      {
        path: "leases/create",
        element: (
          <Suspense fallback={<Loader />}>
            <CreateLease />
          </Suspense>
        ),
      },
      {
        path: "leases/:leaseId",
        element: (
          <Suspense fallback={<Loader />}>
            <LeaseDetails />
          </Suspense>
        ),
      },
        {
          path: "leases/:leaseId/edit",
          element: (
            <Suspense fallback={<Loader />}>
              <EditLease />
            </Suspense>
          ),
        },
        {
          path: "maintenance",
          element: (
            <Suspense fallback={<Loader />}>
              <Maintenance />
            </Suspense>
          ),
        },
        {
          path: "maintenance/:requestId",
          element: (
            <Suspense fallback={<Loader />}>
              <MaintenanceDetails />
            </Suspense>
          ),
        },
        {
          path: "tenants",
          element: (
            <Suspense fallback={<Loader />}>
              <Tenants />
            </Suspense>
          ),
        },
        {
          path: "tenants/:tenantId",
          element: (
            <Suspense fallback={<Loader />}>
              <TenantDetails />
            </Suspense>
          ),
        },
        {
          path: "tenants/:tenantId/behavior-report",
          element: (
            <Suspense fallback={<Loader />}>
              <BehaviorReport />
            </Suspense>
          ),
        },
        {
          path: "payments",
          element: (
            <Suspense fallback={<Loader />}>
              <Payments />
            </Suspense>
          ),
        },
        {
          path: "payments/:paymentId",
          element: (
            <Suspense fallback={<Loader />}>
              <PaymentDetails />
            </Suspense>
          ),
        },
        {
          path: "leases/:leaseId/payments",
          element: (
            <Suspense fallback={<Loader />}>
              <LeasePaymentHistory />
            </Suspense>
          ),
        },
        {
          path: "payments/reports",
          element: (
            <Suspense fallback={<Loader />}>
              <PaymentReports />
            </Suspense>
          ),
        },
        {
          path: "financials",
          element: (
            <Suspense fallback={<Loader />}>
              <Financials />
            </Suspense>
          ),
        },
        {
          path: "reports",
          element: (
            <Suspense fallback={<Loader />}>
              <Reports />
            </Suspense>
          ),
        },
      {
        path: "account",
        element: (
          <Suspense fallback={<Loader />}>
            <AccountProfile />
          </Suspense>
        ),
      },
      {
        path: "messages",
        element: (
          <Suspense fallback={<Loader />}>
            <Messages />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "tenant",
    element: (
      <ProtectedRoute allowedRoles={["TENANT"]}>
        <Suspense fallback={<Loader />}>
          <TenantLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loader />}>
            <TenantDashboard />
          </Suspense>
        ),
      },
      {
        path: "account",
        element: (
          <Suspense fallback={<Loader />}>
            <AccountProfile />
          </Suspense>
        ),
      },
      {
        path: "messages",
        element: (
          <Suspense fallback={<Loader />}>
            <Messages />
          </Suspense>
        ),
      },
      {
        path: "lease",
        element: (
          <Suspense fallback={<Loader />}>
            <MyLease />
          </Suspense>
        ),
      },
      {
        path: "payments",
        element: (
          <Suspense fallback={<Loader />}>
            <TenantPayments />
          </Suspense>
        ),
      },
      {
        path: "maintenance",
        element: (
          <Suspense fallback={<Loader />}>
            <TenantMaintenance />
          </Suspense>
        ),
      },
      {
        path: "properties/:propertyId",
        element: (
          <Suspense fallback={<Loader />}>
            <TenantPropertyDetails />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "tenant/browse-properties",
    element: (
      <Suspense fallback={<Loader />}>
        <BrowseProperties />
      </Suspense>
    ),
  },
  {
    path: "admin",
    element: (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <Suspense fallback={<Loader />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loader />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: "account",
        element: (
          <Suspense fallback={<Loader />}>
            <AccountProfile />
          </Suspense>
        ),
      },
      {
        path: "property-requests",
        element: (
          <Suspense fallback={<Loader />}>
            <PropertyRequests />
          </Suspense>
        ),
      },
      {
        path: "users",
        element: (
          <Suspense fallback={<Loader />}>
            <AllUsers />
          </Suspense>
        ),
      },
      {
        path: "landlords",
        element: (
          <Suspense fallback={<Loader />}>
            <AdminLandlords />
          </Suspense>
        ),
      },
      {
        path: "tenants",
        element: (
          <Suspense fallback={<Loader />}>
            <AdminTenants />
          </Suspense>
        ),
      },
      {
        path: "verifications",
        element: (
          <Suspense fallback={<Loader />}>
            <Verifications />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<Loader />}>
        <NotFound />
      </Suspense>
    ),
  },
  {
    path: "unauthorized",
    element: (
      <Suspense fallback={<Loader />}>
        <Unauthorized />
      </Suspense>
    ),
  },
  {
    path: "disabled",
    element: (
      <Suspense fallback={<Loader />}>
        <DisabledAccount />
      </Suspense>
    ),
  },
]);

// ------------------------------- APP
const App = () => {
  const { setUser, setLoading, setValidated, loading, validated } =
    useAuthStore();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const initAuth = async () => {
      setLoading(true);
      try {
        await checkAuthStatusRequest({ signal });
        const userRes = await getUserInfoRequest({ signal });
        setUser(userRes.data.user);
      } catch (err: any) {
        if ([401, 403, 500].includes(err.response?.status)) {
          try {
            await refreshTokenRequest({ signal });
            await checkAuthStatusRequest({ signal });
            const userRes = await getUserInfoRequest({ signal });
            setUser(userRes.data.user);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setValidated(true);
        setLoading(false);
      }
    };

    initAuth();
    return () => controller.abort();
  }, [setUser, setLoading, setValidated]);

  if (loading || !validated) {
    return <Loader />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        theme="system"
        duration={4000}
        closeButton
        offset={40}
        expand
        visibleToasts={2}
        richColors
      />
    </>
  );
};

export default App;
