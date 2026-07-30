import { NextResponse } from "next/server";

import { createGrowthEvent } from "@/lib/growth/events/createEvent";
import type { CreateGrowthEventInput } from "@/lib/growth/events/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateGrowthEventInput;

    if (!body.eventType) {
      return NextResponse.json(
        {
          success: false,
          error: "eventType is required.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Unable to identify growth-event user:",
        userError,
      );
    }

    const event = await createGrowthEvent({
      ...body,

      /*
       * Always use the verified server-side identity.
       * This overrides any userId sent by the browser.
       */
      userId: user?.id,
    });

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Growth event API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to record growth event.",
      },
      {
        status: 500,
      },
    );
  }
}