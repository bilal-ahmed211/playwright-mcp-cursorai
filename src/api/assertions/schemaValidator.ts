import Ajv, { JSONSchemaType, ValidateFunction, ErrorObject } from 'ajv/dist/ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

export function validateSchema<T>(data: unknown, schema: JSONSchemaType<T>): { valid: boolean; errors?: string[] } {
  let validate: ValidateFunction<T>;
  try {
    validate = ajv.compile(schema);
  } catch (e) {
    return { valid: false, errors: ['Invalid schema: ' + (e as Error).message] };
  }
  const valid = validate(data);
  return {
    valid: !!valid,
    errors: valid ? undefined : (validate.errors || []).map((err: ErrorObject) => `${err.instancePath} ${err.message}`.trim()),
  };
} 