import { NextResponse } from "next/server";
import { hasKofSportsProAccess } from "@/lib/auth/entitlements";
import { BETTING_BOARD_EVENTS, bettingBoardEventInput, type BettingBoardEvent } from "@/lib/growth/events/betting-board-policy";

import { createGrowthEvent } from "@/lib/growth/events/createEvent";
import { GROWTH_EVENT_TYPES, type CreateGrowthEventInput } from "@/lib/growth/events/types";
import { createClient } from "@/lib/supabase/server";
import { FREE_ACCOUNT_CLIENT_EVENTS, FREE_ACCOUNT_SERVER_EVENTS, cleanAnalyticsPage, cleanAnalyticsUuid, sanitizeFreeAccountMetadata } from "@/lib/growth/events/free-account-policy";

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateGrowthEventInput;

    if (!body.eventType || typeof body.eventType !== "string" || !(GROWTH_EVENT_TYPES as readonly string[]).includes(body.eventType)) {
      return NextResponse.json(
        {
          success: false,
          error: "A supported eventType is required.",
        },
        {
          status: 400,
        },
      );
    }
    // Completion/activity events are generated only by authoritative database writes.
    if ((FREE_ACCOUNT_SERVER_EVENTS as readonly string[]).includes(body.eventType)) {
      return NextResponse.json({ error: "This event is recorded by the server." }, { status: 403 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && userError.name !== "AuthSessionMissingError") {
      console.error(
        "Unable to identify growth-event user:",
        userError,
      );
    }

    const boardEvent = (BETTING_BOARD_EVENTS as readonly string[]).includes(body.eventType);
    const boardPro = boardEvent ? await hasKofSportsProAccess() : false;
    if (boardEvent && ["betting_board_filter", "betting_board_sort", "betting_board_player_click", "betting_board_preference_change", "betting_board_saved_view", "betting_board_saved_upgrade_click"].includes(body.eventType) && !boardPro && !user) {
      return NextResponse.json({ error: "An account is required for board interactions." }, { status: 403 });
    }
    if (body.eventType === "betting_board_locked_preview_view" && boardPro) {
      return NextResponse.json({ error: "Locked preview event requires restricted access." }, { status: 400 });
    }
    const freeAccountEvent = (FREE_ACCOUNT_CLIENT_EVENTS as readonly string[]).includes(body.eventType);
    if (body.eventType === "saved_players_dashboard_view" && !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (body.eventType === "save_player_auth_prompt" && user) {
      return NextResponse.json({ error: "Anonymous event required." }, { status: 400 });
    }
    const input: CreateGrowthEventInput = boardEvent ? bettingBoardEventInput(body.eventType as BettingBoardEvent, body, Boolean(user), boardPro) : freeAccountEvent ? {
      eventType: body.eventType,
      eventId: cleanAnalyticsUuid(body.eventId),
      page: cleanAnalyticsPage(body.page),
      anonymousId: cleanAnalyticsUuid(body.anonymousId),
      sessionId: cleanAnalyticsUuid(body.sessionId),
      metadata: sanitizeFreeAccountMetadata(body.metadata, Boolean(user)),
    } : body;
    if (freeAccountEvent && (!input.page ||
        ((body.eventType === "save_player_click" || body.eventType === "save_player_auth_prompt") && !input.metadata?.sport) ||
        (body.eventType === "saved_players_dashboard_view" && input.page !== "/account"))) {
      return NextResponse.json({ error: "Invalid conversion event context." }, { status: 400 });
    }
    const event = await createGrowthEvent({
      ...input,

      /*
       * Always use the verified server-side identity.
       * This overrides any userId sent by the browser.
       */
      userId: user?.id,
    });

    return NextResponse.json({
      success: true,
      event: { id: event.id },
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
