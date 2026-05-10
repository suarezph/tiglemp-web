import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, generalApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { LoginResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      api.post<LoginResponse>('/auth/login', vars),
    onSuccess: (response) => {
      const { user, token } = response.data;
      if (user.role !== 'ADMIN') {
        mutation.reset();
        return;
      }
      setSession(token, user);
      navigate('/dashboard', { replace: true });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  const errorMessage = (() => {
    if (mutation.data && mutation.data.data.user.role !== 'ADMIN') {
      return 'This account is not an administrator.';
    }
    return generalApiErrorMessage(mutation.error);
  })();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className='text-center'>
          <div className="flex justify-center mb-2">
            <div className="grid place-items-center size-14 rounded-2xl bg-foreground/[0.04] ring-1 ring-border">
              <img
                src="/logo-tiger.png"
                alt=""
                aria-hidden="true"
                className="size-10 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-xl">Admin Sign In</CardTitle>
          <CardDescription>
            Sign in with your administrator credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
