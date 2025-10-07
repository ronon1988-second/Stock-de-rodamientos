
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
import { doc, setDoc, getDoc } from "firebase/firestore";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const ensureAdminRole = async (user: User) => {
    if (user.email === 'maurofbordon@gmail.com') {
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { role: 'admin' }, { merge: true });
    }
  };


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
        let userCredential;
        if (action === "login") {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
            await ensureAdminRole(userCredential.user); // Check for admin role on login
            toast({
                title: "Inicio de sesión exitoso",
                description: "Bienvenido de nuevo.",
            });
        } else {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const userRef = doc(firestore, "users", user.uid);
            
            const isAdminUser = user.email === 'maurofbordon@gmail.com';
            const role = isAdminUser ? 'admin' : 'editor';

            await setDoc(userRef, { 
              uid: user.uid,
              email: user.email,
              role: role,
              displayName: user.email?.split('@')[0] || 'Usuario'
            });

            toast({
                title: "Cuenta creada",
                description: "Se ha registrado exitosamente.",
            });
        }
        router.push('/');
    } catch (error: any) {
      let description = "Ha ocurrido un error inesperado.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = "El email o la contraseña son incorrectos."
      } else if (error.code === 'auth/email-already-in-use') {
          description = "Este email ya está registrado. Intente iniciar sesión."
      } else if (error.code === 'auth/weak-password') {
          description = "La contraseña debe tener al menos 6 caracteres."
      }
      toast({
        variant: "destructive",
        title: `Error de ${action === 'login' ? 'inicio de sesión' : 'registro'}`,
        description: description,
      });
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
