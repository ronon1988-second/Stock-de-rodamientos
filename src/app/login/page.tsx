
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
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const updateUserProfileAndClaims = async (user: User) => {
    const userRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userRef);

    const isAdminUser = user.email === 'maurofbordon@gmail.com';
    // Default role is 'editor', unless they are the admin or already have a role.
    const role = isAdminUser ? 'admin' : (userDoc.exists() && userDoc.data().role ? userDoc.data().role : 'editor');

    // Data to be set in Firestore
    const userData = {
        uid: user.uid,
        email: user.email,
        role: role,
        displayName: user.email?.split('@')[0] || 'Usuario',
        createdAt: serverTimestamp() // Add a creation timestamp
    };

    // Only write to Firestore if the document doesn't exist, the role needs an update, or the display name is missing
    if (!userDoc.exists() || userDoc.data().role !== role || !userDoc.data().displayName) {
        await setDoc(userRef, userData, { merge: true });
    }
    
    // If the user is an admin, we must force a token refresh to get custom claims.
    if (isAdminUser) {
        // This is a placeholder for a server-side function call that would set the custom claim.
        // In a real app, this would be an HTTPS Callable Function.
        // For this environment, we assume a mechanism exists to link this client-side action
        // to a server-side claim update, and we force a refresh to get the new token.
        await user.getIdToken(true); // Force refresh of the ID token
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
        } else {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
        }

        // After login or signup, ensure the user profile and claims are correct
        await updateUserProfileAndClaims(userCredential.user);
        
        toast({
            title: action === 'login' ? "Inicio de sesión exitoso" : "Cuenta creada",
            description: action === 'login' ? "Bienvenido de nuevo." : "Se ha registrado exitosamente.",
        });

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
