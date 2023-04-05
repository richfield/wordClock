import { Form } from 'react-bootstrap';
import { FieldRenderProps } from 'react-final-form';

export const FormSelect: React.FunctionComponent<FieldRenderProps<string>> = (
    props
) => {
    const { input, meta, items } = props;
    const hasError = meta.touched && (meta.error || meta.submitError);
    return (
        <>
            <Form.Select
                {...input}
                style={{ backgroundColor: hasError && '#f8d7da' }}
            >
                <option value=''>Kies Optie</option>
                {items.map((item: any, i: number) => (
                    <option key={i} value={item.value}>
                        {item.text}
                    </option>
                ))}
            </Form.Select>
            {hasError && (
                <span>{meta.error || meta.submitError}</span>
            )}
        </>
    );
};