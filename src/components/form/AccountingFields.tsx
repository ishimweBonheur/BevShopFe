import { Dialog } from '@headlessui/react';
import React, { FormEvent, useId } from 'react';
export type Row = Record<string, any>;
export const amount = (value: any) => 'RWF ' + Number(value || 0).toLocaleString('en-RW', { maximumFractionDigits: 2 });
export const values = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); return Object.fromEntries(new FormData(event.currentTarget).entries()); };
export function Field({ label, name, type = 'text', value, optional = false, step }: {
    label: string;
    name: string;
    type?: string;
    value?: any;
    optional?: boolean;
    step?: string;
}) {
    const id = useId();
    const shown = value === undefined || value === null || value === '' ? undefined : type === 'number' ? String(Number(value)) : value;
    return <div><label htmlFor={id}>{label}</label><input id={id} className="form-input min-h-[44px] text-base" name={name} type={type} defaultValue={shown} required={!optional} step={step || (type === 'number' ? '0.01' : undefined)} min={type === 'number' ? '0' : undefined}/></div>;
}
export function Table({ headers, children }: {
    headers: string[];
    children: React.ReactNode;
}) {
    return <div className="table-responsive"><table className="table-hover"><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function ShopModal({title,open,onClose,children}:{title:string;open:boolean;onClose:()=>void;children:React.ReactNode}) {
 return <Dialog open={open} onClose={onClose} className="relative z-[999] print:hidden"><div className="fixed inset-0 bg-black/60" aria-hidden="true"/><div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4"><Dialog.Panel className="panel w-full max-w-3xl space-y-5"><div className="flex items-center justify-between"><Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title><button type="button" className="btn btn-outline-primary" onClick={onClose}>Close</button></div>{children}</Dialog.Panel></div></div></Dialog>;
}
