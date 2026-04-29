import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Lock, Loader2, CheckCircle, XCircle } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://http://localhost:8000";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [status, setStatus]         = useState("idle"); // idle | loading | success | error
  const [message, setMessage]       = useState("");

  // ── Guard: no token in URL ──────────────────────────────────────────────
  // This is Bug #2 symptom — if the router wasn't rendering this page,
  // the token would never be read. Showing a clear error helps debugging.
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/80 backdrop-blur p-8 rounded-2xl shadow-xl
                     space-y-4 text-center"
        >
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Invalid Link</h2>
          <p className="text-sm text-muted-foreground">
            This password reset link is missing a token. Please request a
            new reset link.
          </p>
          <Button
            className="w-full rounded-full h-11"
            onClick={() => navigate("/forgot-password")}
          >
            Request New Link
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Validation ──────────────────────────────────────────────────────────
  const passwordError = () => {
    if (password.length > 0 && password.length < 6)
      return "Password must be at least 6 characters";
    if (confirm.length > 0 && password !== confirm)
      return "Passwords do not match";
    return null;
  };

  const validationError = passwordError();
  const canSubmit =
    password.length >= 6 &&
    confirm === password &&
    status !== "loading";

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setMessage("");

    try {
      await axios.post(
        `${API_BASE}/api/auth/reset-password`,
        { token, new_password: password },
        { withCredentials: true }
      );

      setStatus("success");
      setMessage("Password reset successfully! Redirecting to login…");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setStatus("error");
      const detail = err?.response?.data?.detail;
      setMessage(
        detail === "Invalid or expired reset token"
          ? "This link has already been used or has expired. Please request a new one."
          : detail || "Something went wrong. Please try again."
      );
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur p-8 rounded-2xl
                   shadow-xl space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Reset Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {/* Success state */}
        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm text-center text-muted-foreground">
              {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error banner */}
            {status === "error" && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40
                              bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* New password */}
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-muted-foreground h-5 w-5" />
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  className="pl-10 h-11 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-muted-foreground h-5 w-5" />
                <Input
                  type="password"
                  placeholder="Repeat your new password"
                  className="pl-10 h-11 rounded-xl"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              {validationError && (
                <p className="text-xs text-destructive">{validationError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-11"
              disabled={!canSubmit}
            >
              {status === "loading"
                ? <Loader2 className="animate-spin" />
                : "Reset Password"
              }
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remember it?{" "}
              <Link to="/login" className="underline hover:text-primary">
                Back to login
              </Link>
            </p>
          </form>
        )}

        {/* Expired link help */}
        {status === "error" && (
          <div className="text-center">
            <Button
              variant="ghost"
              className="text-sm h-auto p-0 underline"
              onClick={() => navigate("/forgot-password")}
            >
              Request a new reset link
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}