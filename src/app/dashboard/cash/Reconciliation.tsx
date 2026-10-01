import React, { useEffect, useState, useCallback } from 'react';
import InventoryPage from '@/components/form/InventoryPage';
import { useInventory } from '@/core/provider/InventoryProvider';
import { api } from '@/hooks/api';
import { Field, Table, amount, values, Row } from '@/components/form/AccountingFields';

export default function Reconciliation() {
  const { save, revision, setError } = useInventory();
  const [date, setDate] = useState('');
  const [preview, setPreview] = useState<Row | null>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [cash, setCash] = useState('');
  const [mobile, setMobile] = useState('');

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/reconciliations/preview', { params: { date } });
      setPreview(r.data);
    } catch (e: any) {
      setPreview(null);
      setError(e.response?.data?.error || 'Could not load balances');
    }
  }, [date, setError]);

  useEffect(() => {
    setPreview(null);
    refresh();
  }, [refresh, revision]);

  useEffect(() => {
    api.get('/reconciliations')
      .then(r => setHistory(r.data))
      .catch(() => setError('Could not load reconciliations'));
  }, [revision, setError]);

  return (
    <InventoryPage title="Daily cash reconciliation">
      <section className="panel space-y-5">
        <p>
          Count the cash in the shop and the Mobile Money balance. Expected balances
          include all recorded opening funds, receipts and payments. Saving a comparison
          does not change your accounts.
        </p>

        <label>
          Business date
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </label>

        <button className="btn btn-outline-primary" onClick={refresh}>
          Refresh expected balances
        </button>

        {preview && (
          <form
            className="space-y-5"
            onSubmit={async e => {
              const b = values(e);
              await save('reconciliations', {
                ...b,
                date: preview.date,
                expectedCash: preview.expectedCash,
                expectedMobile: preview.expectedMobile,
                actualCash: cash,
                actualMobile: mobile,
              });
            }}
          >
            <p>
              Comparison for {preview.date}, through{' '}
              {new Date(preview.cutoff).toLocaleString('en-GB', {
                timeZone: 'Africa/Kigali',
              })}
            </p>

            <Table
              headers={[
                'Account',
                'Expected',
                'Actual counted',
                'Difference (actual minus expected)',
              ]}
            >
              {[
                ['Cash', preview.expectedCash, cash, setCash],
                ['Mobile Money', preview.expectedMobile, mobile, setMobile],
              ].map(([label, expected, actual, set]: any) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{amount(expected)}</td>
                  <td>
                    <label>
                      {label} actual (RWF)
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="0.000001"
                        value={actual}
                        required
                        onChange={e => set(e.target.value)}
                      />
                    </label>
                  </td>
                  <td>
                    {actual !== ''
                      ? amount(Number(actual) - Number(expected))
                      : '—'}
                  </td>
                </tr>
              ))}
            </Table>

            <Field
              label="Reason / notes (required for a difference)"
              name="notes"
              optional
            />
            <button className="btn btn-primary">Save reconciliation</button>
          </form>
        )}
      </section>

      <section className="panel space-y-4">
        <h2 className="text-lg font-semibold">Saved comparisons (latest 365)</h2>
        <Table
          headers={[
            'Date',
            'Expected cash',
            'Actual cash',
            'Cash difference',
            'Expected Mobile Money',
            'Actual Mobile Money',
            'Mobile difference',
            'Notes',
          ]}
        >
          {history.map(r => (
            <tr key={r.id}>
              <td>{String(r.business_date).slice(0, 10)}</td>
              <td>{amount(r.expected_cash)}</td>
              <td>{amount(r.actual_cash)}</td>
              <td>{amount(r.cash_difference)}</td>
              <td>{amount(r.expected_mobile)}</td>
              <td>{amount(r.actual_mobile)}</td>
              <td>{amount(r.mobile_difference)}</td>
              <td>{r.notes}</td>
            </tr>
          ))}
        </Table>
      </section>
    </InventoryPage>
  );
}