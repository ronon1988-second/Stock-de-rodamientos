"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function UserManagementView() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestionar Usuarios</CardTitle>
                <CardDescription>
                    Asigne roles a los usuarios para controlar sus permisos dentro de la aplicación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <Wrench className="h-12 w-12" />
                    <p className="text-center">La sección de gestión de usuarios está temporalmente en mantenimiento.</p>
                    <p className="text-sm text-center">Estamos trabajando para restaurar esta funcionalidad de forma segura.</p>
                </div>
            </CardContent>
        </Card>
    );
}
