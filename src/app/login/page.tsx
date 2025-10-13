
"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/logo";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { setupUserAndRole } from "../actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAction, setLoadingAction] = useState<'login' | 'signup' | null>(null);
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const handleAuthenticationSuccess = async (user: User) => {
    // Run the server action to ensure the user document and role document exist in Firestore.
    const result = await setupUserAndRole(user.uid, user.email);
    
    if (result.success) {
      toast({
          title: "Éxito de inicio de sesión",
          description: "¡Bienvenido! Redirigiendo...",
      });
      // A standard router push is sufficient now that the server action is robust.
      router.push('/');
      router.refresh(); // This helps ensure the client gets fresh data after login.
    } else {
        setLoadingAction(null); // Stop loading on failure
        const errorMessage = result.error || "No se pudo configurar el perfil del usuario. Por favor, intente de nuevo.";
        console.error("Account setup failed:", errorMessage);
        toast({
            variant: "destructive",
            title: "Error de configuración de la cuenta",
            description: errorMessage,
            duration: 9000,
        });
    }
  }

  const handleAuthAction = async (action: "login" | "signup") => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, ingrese su email y contraseña.",
      });
      return;
    }
    
    setLoadingAction(action);

    try {
      let userCredential;
      if (action === "signup") {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else { // login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      // This will now handle the redirect internally upon success
      await handleAuthenticationSuccess(userCredential.user);

    } catch (error: any) {
      let description = "Ha ocurrido un error inesperado.";
      let title = `Error de ${action === 'login' ? 'inicio de sesión' : 'registro'}`;
      
      console.error(`Auth Error (${action}):`, error);

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = "El email o la contraseña son incorrectos.";
          break;
        case 'auth/email-already-in-use':
          description = "Este email ya está registrado. Intente iniciar sesión.";
          title = "Error de Registro";
          break;
        case 'auth/weak-password':
          description = "La contraseña debe tener al menos 6 caracteres.";
          break;
        default:
            description = error.message; // Show the specific Firebase error message
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: description,
        duration: 9000,
      });
      
      setLoadingAction(null); // Ensure loading is stopped on auth error
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo className="h-12 w-12 text-primary" />
            </div>
          <CardTitle className="text-2xl">Bearing Balance</CardTitle>
          <CardDescription>
            Inicie sesión o cree una cuenta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!loadingAction}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!!loadingAction}
            />
          </div>
        </CardContent>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={() => handleAuthAction("signup")}
            disabled={!!loadingAction}
          >
            {loadingAction === 'signup' ? 'Registrando...' : 'Registrarse'}
          </Button>
          <Button
            onClick={() => handleAuthAction("login")}
            disabled={!!loadingAction}
          >
            {loadingAction === 'login' ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
