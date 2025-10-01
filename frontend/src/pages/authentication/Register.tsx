import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, Eye, EyeOff, User, Check, Key, AlertCircle } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { registerRequest } from "@/api/authApi"; 
import { toast } from "sonner";

const Register = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-teal-300/20 to-blue-300/20"
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
        className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row items-stretch z-10 min-h-[650px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Panel - Visual Design */}
        <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-teal-600 to-blue-700 p-8 text-white flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-white"></div>
            <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-white rotate-45"></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2 mb-6">
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
                <Zap className="h-8 w-8 text-teal-200" fill="currentColor" />
              </motion.div>
              <span className="text-2xl font-bold">RentEase</span>
            </div>

            <h2 className="text-xl font-semibold mb-4">
              Join Thousands of Happy Renters
            </h2>
            <p className="text-teal-100 mb-6 text-sm">
              Simplify your rental experience with our platform
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-teal-200" />
                <span>Instant property listings</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-teal-200" />
                <span>Secure transactions</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-teal-200" />
                <span>Verified users & properties</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Form Section */}
        <div className="md:w-[55%] p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors"
            >
              <motion.div
                whileHover={{
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.4 },
                }}
              >
                <Zap className="h-5 w-5 text-teal-500" fill="currentColor" />
              </motion.div>
              Back to home
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-100 to-blue-100 rounded-2xl mb-4 shadow-md">
                <div className="bg-gradient-to-br from-teal-600 to-blue-700 p-3 rounded-xl">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Create Account
              </h1>
              <p className="text-gray-500 text-sm">
                Sign up to get started with RentEase
              </p>
            </div>

            <RegisterForm />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const RegisterForm = () => {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState<"tenant" | "landlord">("tenant");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await registerRequest({
        email,
        password,
        confirmPassword,
        role: userRole.toUpperCase(),
      });

      // success toast
      toast.success(res.data.message);

      // redirect to verification page, passing the token in url
      navigate(`/auth/verify-email/${res.data.token}`);
      
    } catch (err: any) {
      console.error("Register error:", err);
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      toast.error("Registration Failed, review the form!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={() => setUserRole("tenant")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm ${
                userRole === "tenant"
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-300 text-gray-500 hover:border-teal-300"
              }`}
            >
              <User className="h-4 w-4" />
              Tenant
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setUserRole("landlord")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm ${
                userRole === "landlord"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-500 hover:border-blue-300"
              }`}
            >
              <Key className="h-4 w-4" />
              Landlord
            </motion.button>
          </div>
        </div>

        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
              focus:outline-none focus:border-teal-400 focus:ring-0 
              transition-colors text-sm"
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
              focus:outline-none focus:border-teal-400 focus:ring-0 
              transition-colors text-sm"
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Password must include uppercase, lowercase, number, and symbol
          </div>
        </div>

        {/* Confirm Password field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
              focus:outline-none focus:border-teal-400 focus:ring-0 
              transition-colors text-sm"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start gap-3">
          <motion.button
            type="button"
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            whileTap={{ scale: 0.9 }}
            className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors ${
              acceptedTerms
                ? "bg-teal-500 border-teal-500 text-white"
                : "border-gray-300"
            }`}
          >
            {acceptedTerms && <Check className="h-3 w-3" />}
          </motion.button>
          <label htmlFor="terms" className="text-xs text-gray-600">
            I agree to the{" "}
            <a href="#" className="text-teal-600 hover:text-teal-800 font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-teal-600 hover:text-teal-800 font-medium">
              Privacy Policy
            </a>{" "}
            <span className="text-red-500">*</span>
          </label>
        </div>

        {/* Error message container with fixed height */}
        <div className="min-h-[60px] max-h-24 overflow-y-auto transition-all duration-300">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 break-words">{error}</p>
            </div>
          )}
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!acceptedTerms || loading}
          whileHover={{ scale: acceptedTerms && !loading ? 1.02 : 1 }}
          whileTap={{ scale: acceptedTerms && !loading ? 0.98 : 1 }}
          className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-teal-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </motion.button>

        <div className="text-center text-xs text-gray-500 pt-3">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;