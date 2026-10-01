import React from 'react';
import InventoryPage from '@/components/form/InventoryPage';
import { useInventory } from '@/core/provider/InventoryProvider';
import TransactionHistory from '@/components/form/TransactionHistory';
import { Field } from '@/components/form/AccountingFields';
export default function Losses() {
    const { submit, productSelect } = useInventory();
    return <InventoryPage title="Damaged products" managerOnly={true}><section className="panel space-y-5"><h2 className="text-lg font-semibold">Damaged, expired or missing items</h2><form className="space-y-5" onSubmit={submit('losses')}><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{productSelect}<Field label="Individual items lost" name="quantity" type="number" step="1"/><Field label="Date" name="date" type="date" optional/><Field label="Reason" name="notes"/></div><p className="text-sm text-gray-600 dark:text-gray-400">Stock is reduced and its recorded cost is shown as a loss.</p><button className="btn btn-primary inline-flex disabled:opacity-50">Record stock loss</button></form></section><TransactionHistory kind="loss"/></InventoryPage>;
}
