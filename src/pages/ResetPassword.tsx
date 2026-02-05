import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Reset password - session check:', !!session);
        
        if (session) {
          setIsValidSession(true);
        } else {
          toast({
            title: "Invalid or Expired Link",
            description: "This password reset link is invalid or has expired. Please request a new one.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset. You are now logged in.",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
          poster="/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png"
        >
          <source 
            src="https://ismifvjzvvylehmdmdrz.supabase.co/storage/v1/object/public/data101/video.mp4" 
            type="video/mp4" 
          />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <Navigation />
      
      <main className="relative z-10 pt-20">
        <section className="py-24">
          <div className="max-w-md mx-auto px-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-white mb-4 tracking-wide">
                Reset Your Password
              </h1>
              <p className="text-white/80 text-lg">
                {isValidSession 
                  ? "Enter your new password below"
                  : "This link is invalid or has expired"}
              </p>
            </div>

            <Card className="wellness-card backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl">
              <CardContent className="p-8">
                {isValidSession ? (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="new-password" className="flex items-center gap-2 text-white font-medium">
                        <Lock className="h-4 w-4" />
                        New Password
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="confirm-new-password" className="flex items-center gap-2 text-white font-medium">
                        <Lock className="h-4 w-4" />
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
                        required
                        minLength={6}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      disabled={loading}
                    >
                      {loading ? "Updating Password..." : "Update Password"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-white/80">
                      Please request a new password reset link.
                    </p>
                    <Button 
                      onClick={() => navigate("/auth")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Go to Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResetPassword;
