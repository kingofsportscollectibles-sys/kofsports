"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type ClickableOrderRowProps = {
  href: string;
  children: ReactNode;
};

export default function ClickableOrderRow({
  href,
  children,
}: ClickableOrderRowProps) {
  const router = useRouter();

  function openOrder() {
    router.push(href);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTableRowElement>,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openOrder();
    }
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={openOrder}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
    >
      {children}
    </tr>
  );
}