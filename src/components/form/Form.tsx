import clsx from 'clsx';
import { ReactNode } from 'react';
import {
	useForm,
	UseFormReturn,
	SubmitHandler,
	UseFormProps,
	FieldValues,
} from 'react-hook-form';
import { ZodType, ZodTypeDef } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type FormProps<TFormValues extends FieldValues, Schema> = {
	children: (methods: UseFormReturn<TFormValues>) => ReactNode;
	onSubmit: SubmitHandler<TFormValues>;
	schema?: Schema;
	options?: UseFormProps<TFormValues>;
	className?: string;
};

export const Form = <
	TFormValues extends Record<string, unknown> = Record<string, unknown>,
	Schema extends ZodType<unknown, ZodTypeDef, unknown> = ZodType<
		unknown,
		ZodTypeDef,
		unknown
	>
>(
	props: FormProps<TFormValues, Schema>
) => {
	const { children, onSubmit, schema, options, className } = props;

	const methods = useForm<TFormValues>({
		shouldUnregister: true,
		...options,
		resolver: schema && zodResolver(schema),
	});

	return (
		<form
			onSubmit={methods.handleSubmit(onSubmit)}
			className={clsx('', className)}
		>
			{children(methods)}
		</form>
	);
};
