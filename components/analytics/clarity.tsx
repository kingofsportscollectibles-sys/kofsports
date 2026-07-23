"use client";

import { useEffect } from "react";
import clarity from "@microsoft/clarity";

export default function Clarity() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const projectId = process.env.NEXT_PUBLIC_CLARITY_ID;

    if (projectId) {
      clarity.init(projectId);
    }
  }, []);

  return null;
}