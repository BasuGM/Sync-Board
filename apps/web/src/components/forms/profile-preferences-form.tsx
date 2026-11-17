'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  type ProfilePreferencesForm,
  profilePreferencesSchema,
} from '@/lib/forms/profile-preferences-schema';

export function ProfilePreferencesForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ProfilePreferencesForm>({
    resolver: zodResolver(profilePreferencesSchema),
    defaultValues: {
      displayName: '',
      notificationsEnabled: true,
    },
  });

  return (
    <form
      className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      onSubmit={handleSubmit(() => undefined)}
      aria-label="Profile preferences placeholder form"
    >
      <h3 className="text-sm font-medium">Profile preferences (placeholder)</h3>
      <label className="block text-sm">
        Display name
        <input
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2"
          {...register('displayName')}
        />
        {errors.displayName && (
          <span className="mt-1 block text-xs text-red-600">{errors.displayName.message}</span>
        )}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('notificationsEnabled')} />
        Enable notifications
      </label>
      <button
        type="submit"
        className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm text-[var(--primary-foreground)]"
      >
        Save preferences
      </button>
      {isSubmitSuccessful && (
        <p className="text-xs text-emerald-600">Validation pipeline ready for Milestone 2+.</p>
      )}
    </form>
  );
}