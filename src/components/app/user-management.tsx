"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';


export default function UserManagementView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestionar Roles de Usuario</CardTitle>
                <CardDescription>
                Asigne un rol a un usuario específico utilizando su dirección de correo electrónico.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Función Deshabilitada</AlertTitle>
                    <AlertDescription>
                        La gestión de roles se ha simplificado. Actualmente, solo el usuario maestro (maurofbordon@gmail.com) tiene todos los permisos de administrador. Para habilitar roles para otros usuarios, se requiere contactar a soporte para una configuración avanzada.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
