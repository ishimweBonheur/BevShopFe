export const formatCurrency=(amount:number)=>'RWF '+Number(amount||0).toLocaleString('en-RW',{maximumFractionDigits:2});
