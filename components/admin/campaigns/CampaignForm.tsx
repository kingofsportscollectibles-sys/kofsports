"use client";

import { useActionState } from "react";

import {
  createCampaignAction,
  type CreateCampaignState,
} from "@/app/(admin)/admin/campaigns/new/actions";

const initialState: CreateCampaignState = {};

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="text-sm font-bold text-slate-700">
      {children}
    </span>
  );
}

export default function CampaignForm() {
  const [state, formAction, pending] =
    useActionState(
      createCampaignAction,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Step 1
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Campaign Details
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <FieldLabel>Campaign Name</FieldLabel>

            <input
              name="name"
              type="text"
              required
              placeholder="NFL Week 1 Premium Launch"
              className={inputClassName}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <FieldLabel>Description</FieldLabel>

            <textarea
              name="description"
              rows={4}
              placeholder="Describe the purpose and strategy for this campaign."
              className={inputClassName}
            />
          </label>

          <label className="space-y-2">
            <FieldLabel>Platform</FieldLabel>

            <select
              name="platform"
              defaultValue="x"
              className={inputClassName}
            >
              <option value="x">X</option>
              <option value="email">Email</option>
              <option value="instagram">
                Instagram
              </option>
              <option value="discord">Discord</option>
              <option value="facebook">Facebook</option>
              <option value="multi_channel">
                Multi-Channel
              </option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="space-y-2">
            <FieldLabel>Campaign Type</FieldLabel>

            <select
              name="campaignType"
              defaultValue="sales"
              className={inputClassName}
            >
              <option value="sales">Sales</option>
              <option value="lead_generation">
                Lead Generation
              </option>
              <option value="retention">
                Retention
              </option>
              <option value="reactivation">
                Reactivation
              </option>
              <option value="referral">Referral</option>
              <option value="content">Content</option>
              <option value="giveaway">
                Giveaway
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <FieldLabel>Status</FieldLabel>

            <select
              name="status"
              defaultValue="draft"
              className={inputClassName}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">
                Scheduled
              </option>
              <option value="active">Active</option>
            </select>
          </label>

          <label className="space-y-2">
            <FieldLabel>Budget</FieldLabel>

            <input
              name="budget"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              className={inputClassName}
            />
          </label>

          <label className="space-y-2">
            <FieldLabel>Start Date</FieldLabel>

            <input
              name="startsAt"
              type="datetime-local"
              className={inputClassName}
            />
          </label>

          <label className="space-y-2">
            <FieldLabel>End Date</FieldLabel>

            <input
              name="endsAt"
              type="datetime-local"
              className={inputClassName}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Step 2
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Audience
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <FieldLabel>
              Audience Description
            </FieldLabel>

            <textarea
              name="audienceDescription"
              rows={4}
              placeholder="Example: Inactive premium customers and high-intent NFL leads."
              className={inputClassName}
            />
          </label>

          <label className="space-y-2">
            <FieldLabel>
              Target Lead Count
            </FieldLabel>

            <input
              name="targetLeadCount"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              className={inputClassName}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Step 3
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Campaign Goal
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <FieldLabel>Primary Goal</FieldLabel>

            <select
              name="goalType"
              defaultValue="conversions"
              className={inputClassName}
            >
              <option value="conversations">
                Conversations
              </option>
              <option value="replies">Replies</option>
              <option value="conversions">
                Conversions
              </option>
              <option value="revenue">Revenue</option>
              <option value="traffic">
                Website Traffic
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <FieldLabel>Goal Value</FieldLabel>

            <input
              name="goalValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="10"
              className={inputClassName}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Step 4
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Message Template
        </h2>

        <label className="mt-6 block space-y-2">
          <FieldLabel>Outreach Message</FieldLabel>

          <textarea
            name="messageTemplate"
            rows={8}
            placeholder={`Hey {first_name}, NFL Week 1 is here...`}
            className={inputClassName}
          />
        </label>

        <p className="mt-3 text-xs text-slate-500">
          Message sending will remain manual in Campaigns
          v1. This template gives you one consistent message
          to use and track.
        </p>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <a
          href="/admin/campaigns"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Creating Campaign..."
            : "Create Campaign"}
        </button>
      </div>
    </form>
  );
}