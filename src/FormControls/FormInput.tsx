import { Form } from 'react-bootstrap';
import { FieldRenderProps } from 'react-final-form';

export const FormInput: React.FunctionComponent<FieldRenderProps<string>> = (
    props
) => {
    const { input, meta, rest } = props;
    const hasError = meta.touched && (meta.error || meta.submitError);
    return (
        <>
            <Form.Control
                {...input}
                {...rest}
                style={{ backgroundColor: hasError && '#f8d7da' }}
            />
            {hasError && (
                <span>
                    {' '}
                    &nbsp;
                    {meta.error || meta.submitError}
                </span>
            )}
        </>
    );
};