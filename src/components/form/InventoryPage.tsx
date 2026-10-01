import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useInventory } from '@/core/provider/InventoryProvider';
export default function InventoryPage({ title, managerOnly = false, children }: {
    title: string;
    managerOnly?: boolean;
    children: React.ReactNode;
}) {
    const { manager, settings, error, notice, busy, pending, save } = useInventory();

    return <div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{title}</h1><span className="badge bg-primary">RWF</span></div>
    {error && <div role="alert" className="rounded bg-danger/10 p-4 text-danger">{error}</div>}
    {notice && <div role="status" className="rounded bg-success/10 p-4 text-success">{notice}</div>}
    {pending && <div className="rounded bg-warning/10 p-4 text-warning">An entry needs confirmation. <button className="btn btn-warning mt-2" disabled={busy} onClick={() => save(pending.path, pending.body, pending.method)}>Retry safely</button></div>}
    <fieldset disabled={busy || !!pending} className="min-w-0 space-y-6 disabled:opacity-60">{children}</fieldset>
  </div>;
}
