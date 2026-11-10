import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import fallback from "@/data/nhl/team-betting-records.json";
import type { TeamBettingDataset } from "@/lib/nhl/team-betting-records";
import { refreshStoredTeamRecords } from "@/lib/nhl/team-betting-cache";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=300;
export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret)return NextResponse.json({ok:false,error:"Refresh not configured"},{status:503});
  if(request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
  try{
    const result=await refreshStoredTeamRecords(createAdminClient(),fallback as TeamBettingDataset);
    revalidateTag("nhl-team-records",{expire:0});
    return NextResponse.json({ok:true,...result});
  }catch(error){console.error("NHL team records refresh failed",error instanceof Error?error.message:"unknown");return NextResponse.json({ok:false,error:"Refresh failed; previous records retained"},{status:500});}
}
