'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { registerUser } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { type RegisterFormValues, registerSchema } from '@/lib/forms/auth-schemas';
import { useAuthStore } from '@/stores/auth-store';

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  return (
    <form
      className="w-full max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
      onSubmit={handleSubmit(async ({ name, email, password }) => {
        setFormError(null);
        try {
          const response = await registerUser({ name, email, password });
          setSession(response.accessToken, response.user);
          router.replace('/');
        } catch (error) {
          setFormError(error instanceof ApiError ? error.message : 'Unable to register');
        }
      })}
    >
      <div>
        <h1 className="text-xl font-semibold">Create your SyncBoard account</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Foundation access for Milestone 2.</p>
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <label className="block text-sm">
        Name
        <input
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2"
          {...register('name')}
        />
        {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
      </label>
      <label className="block text-sm">
        Email
        <input
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2"
          {...register('email')}
        />
        {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
      </label>
      <label className="block text-sm">
        Password
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2"
          {...register('password')}
        />
        {errors.password && (
          <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>
        )}
      </label>
      <label className="block text-sm">
        Confirm password
        <input
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <span className="mt-1 block text-xs text-red-600">{errors.confirmPassword.message}</span>
        )}
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}