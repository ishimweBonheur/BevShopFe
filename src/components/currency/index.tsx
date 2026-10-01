import React from 'react';import {formatCurrency} from '@/utils/formatCurrency';export default function CurrencyDisplay({amount}:{amount:number}){return <p>{formatCurrency(amount)}</p>;}
