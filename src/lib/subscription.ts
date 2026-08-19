import { supabase } from '@/lib/supabase';

export type Plan = 'free' | 'monthly' | 'yearly';

export async function getPlan(): Promise<Plan> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 'free';
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Could not get subscription:', error);
    return 'free';
  }

  if (
    data?.plan === 'monthly' ||
    data?.plan === 'yearly'
  ) {
    return data.plan;
  }

  return 'free';
}

export async function setPlan(plan: Plan): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('No logged-in user.');
    return false;
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(
      {
        user_id: user.id,
        plan,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.error('Could not save subscription:', error);
    return false;
  }

  return true;
}

export async function isPremium(): Promise<boolean> {
  const plan = await getPlan();

  return plan === 'monthly' || plan === 'yearly';
}