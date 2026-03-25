import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Handle PKCE OAuth redirect: exchange code from URL for session
      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          setToken(data.session.access_token);
          navigate("/upload", { replace: true });
          return;
        }
      }
      // Fallback: try existing session (covers OTP/magic link flows)
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setToken(data.session.access_token);
        navigate("/upload", { replace: true });
        return;
      }
      navigate("/login", { replace: true });
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
};

export default AuthCallbackPage;
