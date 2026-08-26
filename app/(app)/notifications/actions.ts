"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  revalidatePath("/");
}

export async function markAllNotificationsRead(organizationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("organization_id", organizationId)
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  revalidatePath("/");
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("id", notificationId);
  revalidatePath("/");
}
