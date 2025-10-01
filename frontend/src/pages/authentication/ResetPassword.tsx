import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Lock, Sparkles, Eye, EyeOff, Check, Zap, CheckCircle } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { resetPasswordRequest } from "@/api/authApi";
import { toast } from "sonner";

const ResetPassword = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, when: "beforeChildren" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle floating blobs to match Forgot Password but inverted gradient */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-sky-300/20 to-emerald-300/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 36 + 12}px`,
              height: `${Math.random() * 36 + 12}px`,
              filter: "blur(4px)",
            }}
            animate={{
              y: [0, (Math.random() - 0.5) * 50, 0],
              x: [0, (Math.random() - 0.5) * 50, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: Math.random() * 8 + 8, repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col md:flex-row"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left decorative rail to match Forgot Password */}
        <div className="hidden md:flex md:w-[40%] bg-gradient-to-b from-sky-600 to-emerald-600 text-white p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Sparkles className="w-full h-full" />
          </div>
          <div className="relative z-10 self-center">
            <h2 className="text-xl font-semibold mb-2">Reset Password</h2>
            <p className="text-sky-100 text-sm">Choose a strong new password</p>
          </div>
        </div>

        {/* Right content */}
        <div className="md:w-[60%] p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
              >
                <Zap className="h-5 w-5 text-emerald-500" fill="currentColor" />
              </motion.div>
              Back to home
            </Link>
          </div>
          
          <ResetPasswordForm />
        </div>
      </motion.div>
    </div>
  );
};

const ResetPasswordForm = () => {
  const { token } = useParams<{ token?: string }>();
  
  const [newPassword, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  const passwordOk = passwordPolicy.test(newPassword);
  const match = newPassword.length > 0 && newPassword === confirmPassword;

  // 🔒 Redirect if token is missing or empty
  if (!token || token.trim() === "") {
    return <Navigate to="*" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordOk || !match || !token) return;

    setLoading(true);
    try {
      await resetPasswordRequest({ token, newPassword, confirmPassword });
      toast.success("Password reset successfully!");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-6">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Password Reset Successfully
        </h2>
        <p className="text-gray-600 mb-6">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link
          to="/auth/login"
          className="inline-flex items-center justify-center w-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          Sign In Now
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mb-6">
        <p className="text-gray-800 text-lg font-medium">Choose a new password</p>
        <p className="text-gray-500 text-sm">
          Enter and confirm your new password below.
        </p>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm shadow-sm"
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Check className={`h-3.5 w-3.5 ${passwordOk ? "text-green-600" : "text-gray-300"}`} />
            At least 8 characters with uppercase, lowercase, digit and special numbers
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm shadow-sm"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPassword.length > 0 && (
            <div className={`mt-2 text-xs ${match ? "text-green-600" : "text-red-600"}`}>
              {match ? "Passwords match" : "Passwords do not match"}
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={!passwordOk || !match || loading}
          whileHover={{ scale: !passwordOk || !match || loading ? 1 : 1.02 }}
          whileTap={{ scale: !passwordOk || !match || loading ? 1 : 0.98 }}
          className="w-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Set new password"}
        </motion.button>

        <div className="text-center text-xs text-gray-500 pt-2">
          Return to {""}
          <Link to="/auth/login" className="text-emerald-600 hover:text-emerald-800 font-medium">
            Sign in
          </Link>
        </div>
      </form>
    </>
  );
};

export default ResetPassword;