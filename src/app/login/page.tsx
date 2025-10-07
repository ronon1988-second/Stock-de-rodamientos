
"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdToken,
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
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const handleAuthenticationSuccess = async (user: User, isNewUser: boolean) => {
    // For the master user, always ensure the role and claims are set.
    if (isNewUser || user.email === 'maurofbordon@gmail.com') {
        await setupUserAndRole(user.uid, user.email || "");
    }
    // Force refresh of the ID token to get the latest custom claims.
    await getIdToken(user, true);
    
    toast({
        title: `Éxito de ${isNewUser ? 'registro' : 'inicio de sesión'}`,
        description: "¡Bienvenido!",
    });

    router.push('/');
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
    
    setIsLoading(true);

    try {
      if (action === "signup") {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await handleAuthenticationSuccess(userCredential.user, true);
      } else { // login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthenticationSuccess(userCredential.user, false);
      }
    } catch (error: any) {
      let description = "Ha ocurrido un error inesperado.";
      let title = `Error de ${action === 'login' ? 'inicio de sesión' : 'registro'}`;
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = "El email o la contraseña son incorrectos.";
          break;
        case 'auth/email-already-in-use':
          description = "Este email ya está registrado. Intente iniciar sesión.";
          title = "Error de Registro";
          // Attempt to sign in if email already exists during signup
          if (action === 'signup') {
            try {
              toast({
                  title: "El email ya existe",
                  description: "Intentando iniciar sesión en su lugar...",
              });
              const userCredential = await signInWithEmailAndPassword(auth, email, password);
              await handleAuthenticationSuccess(userCredential.user, false);
            } catch (signInError: any) {
               toast({
                variant: "destructive",
                title: "Error de inicio de sesión",
                description: "El email o la contraseña son incorrectos.",
              });
            }
          }
          break;
        case 'auth/weak-password':
          description = "La contraseña debe tener al menos 6 caracteres.";
          break;
        default:
            console.error("Auth Error:", error.code, error.message);
      }
      
      if (error.code !== 'auth/email-already-in-use') {
         toast({
            variant: "destructive",
            title: title,
            description: description,
          });
      }

    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Logo className="h-12 w-12 text-primary" />
            </div>
          <CardTitle className="text-2xl">Balance de Rodamientos</CardTitle>
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={() => handleAuthAction("signup")}
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </Button>
          <Button
            onClick={() => handleAuthAction("login")}
            disabled={isLoading}
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
