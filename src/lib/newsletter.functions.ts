import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const newsletterEmailSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
});

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => newsletterEmailSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("newsletter_subscriptions").upsert(
      { email: data.email },
      { onConflict: "email", ignoreDuplicates: true },
    );

    if (error) {
      throw new Error("We couldn't save your subscription. Please try again.");
    }

    return { success: true };
  });