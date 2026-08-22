"use client";

import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/login";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl || "/admin"} />
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                autoComplete="username"
                placeholder="admin@clinica.com"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
          </div>
          <FieldError>{state?.error}</FieldError>
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            Ingresar
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
