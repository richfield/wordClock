import { Form } from 'react-bootstrap';
import { FieldRenderProps } from 'react-final-form';

export const FormCheckbox: React.FunctionComponent<FieldRenderProps<boolean>> = (
    props
) => {
    const { input, rest } = props;
    return <Form.Check {...input} {...rest} />;
};