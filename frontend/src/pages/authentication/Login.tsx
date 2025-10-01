// Login Page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, Eye, EyeOff, Home, Building2 } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { getUserInfoRequest, loginRequest } from "@/api/authApi";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

const Login = () => {
  // Background animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        when: "beforeChildren",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-emerald-300/20 to-sky-300/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 40 + 10}px`,
              height: `${Math.random() * 40 + 10}px`,
            }}
            animate={{
              y: [0, (Math.random() - 0.5) * 60, 0],
              x: [0, (Math.random() - 0.5) * 60, 0],
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[3%]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern
              id="grid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <motion.div
        className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row items-stretch z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Panel - Visual Design */}
        <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-emerald-600 to-sky-600 p-8 text-white flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-white"></div>
            <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-white rotate-45"></div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-white/10"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 5, 0],
                  scale: [1, 1.1, 1.05, 1.08, 1],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse" as const,
                  },
                }}
              >
                <Zap
                  className="h-10 w-10 text-emerald-200"
                  fill="currentColor"
                />
              </motion.div>
              <span className="text-2xl font-bold">RentEase</span>
            </div>

            <h2 className="text-xl font-semibold mb-4">
              Welcome Back to RentEase
            </h2>
            <p className="text-emerald-100 mb-6 text-sm">
              Your journey to finding the perfect rental continues here
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Home className="h-5 w-5 text-emerald-200" />
                </div>
                <span className="text-sm">Find your dream home</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-emerald-200" />
                </div>
                <span className="text-sm">Manage your properties</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Form Section */}
        <div className="md:w-[55%] p-6 md:p-8 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <motion.div
                whileHover={{
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.4 },
                }}
              >
                <Zap className="h-5 w-5 text-emerald-500" fill="currentColor" />
              </motion.div>
              Back to home
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-2xl mb-5 shadow-md">
                <div className="bg-gradient-to-br from-emerald-600 to-sky-600 p-3 rounded-xl">
                  <Lock className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Welcome Back
              </h1>
              <p className="text-gray-500 text-sm">
                Sign in to continue to your RentEase account
              </p>
            </div>

            <LoginForm />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

     const setUser = useAuthStore.getState().setUser;

    try {
      const { data } = await loginRequest({ email, password });

      if (data.verified === false) {
        // Email not verified → send user to verify page with token
        navigate(`/auth/verify-email/${data.token}`);
        return;
      }

      if (data.verified === true) {
        try {
          const userInfoRes = await getUserInfoRequest();
          const user = userInfoRes.data.user;

          // ✅ Store user in Zustand
          setUser(user);

          // ✅ Show success toast
          toast.success(data.message || "Login successful");

          // Check if first-time onboarding
          if (!user.hasSeenOnboarding) {
            navigate("/auth/onboarding"); // 🔄 redirect to onboarding
            return;
          }

          // Navigate by role
          switch (user.role) {
            case "ADMIN":
              navigate("/admin");
              break;
            case "LANDLORD":
              navigate("/landlord");
              break;
            case "TENANT":
              navigate("/tenant");
              break;
            default:
              navigate("/"); // fallback
          }

          return;
        } catch (infoErr) {
          setError("Failed to load user info. Please try again.");
        }
      }
    } catch (err: any) {
      if (err.response) {
        const { status, data } = err.response;

        if (status === 403 && data.code === "ACCOUNT_DISABLED") {
          navigate("/auth/disabled");
          return;
        }

        setError(data.message || "Login failed. Please try again.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent 
            transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Password field */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent 
            transition-all text-sm shadow-sm"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-emerald-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Remember me checkbox */}
      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor="remember-me"
          className="ml-2 block text-sm text-gray-700"
        >
          Remember me
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Submit button */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-sky-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-700 hover:to-sky-700 transition-all shadow-md hover:shadow-lg"
      >
        {loading ? "Signing in..." : "Sign In"}
      </motion.button>

      <div className="text-center text-sm text-gray-600 pt-4">
        Don't have an account?{" "}
        <Link
          to="/auth/register"
          className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
        >
          Create account
        </Link>
      </div>
    </form>
  );
};

export default Login;
