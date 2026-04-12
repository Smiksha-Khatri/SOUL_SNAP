import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Mail, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.post(
        "http://localhost:8000/api/auth/forgot-password",
        { email }
      );
      setMessage("Reset link sent! Check your mail");
    } catch {
      setMessage("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur p-8 rounded-2xl shadow-xl space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Forgot Password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a reset link
          </p>
        </div>

        {message && (
          <div className="text-sm text-center text-primary">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="email"
                placeholder="Enter your email"
                className="pl-10 h-11 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full h-11"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}