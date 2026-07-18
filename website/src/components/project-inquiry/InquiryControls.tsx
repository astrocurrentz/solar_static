import type { ReactNode } from 'react';

import type { InquiryFieldErrors } from '../../data/project-inquiry-types';

type FieldShellProps = {
  field: string;
  label: string;
  help?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
};

const FieldShell = ({
  field,
  label,
  help,
  optional = false,
  error,
  children,
}: FieldShellProps) => (
  <div className="inquiry-field" data-field={field}>
    <div className="inquiry-field__heading">
      <label htmlFor={`inquiry-${field}`}>{label}</label>
      {optional ? <span>Optional</span> : <span>Required</span>}
    </div>
    {help ? <p className="inquiry-field__help">{help}</p> : null}
    {children}
    {error ? (
      <p className="inquiry-field__error" id={`inquiry-${field}-error`}>
        {error}
      </p>
    ) : null}
  </div>
);

type TextFieldProps = Omit<FieldShellProps, 'children'> & {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'date' | 'url';
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
};

export const TextField = ({
  field,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  maxLength,
  help,
  optional,
  error,
}: TextFieldProps) => (
  <FieldShell
    field={field}
    label={label}
    help={help}
    optional={optional}
    error={error}
  >
    <input
      id={`inquiry-${field}`}
      name={field}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `inquiry-${field}-error` : undefined}
    />
  </FieldShell>
);

type TextAreaFieldProps = Omit<FieldShellProps, 'children'> & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
};

export const TextAreaField = ({
  field,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  help,
  optional,
  error,
}: TextAreaFieldProps) => (
  <FieldShell
    field={field}
    label={label}
    help={help}
    optional={optional}
    error={error}
  >
    <textarea
      id={`inquiry-${field}`}
      name={field}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `inquiry-${field}-error` : undefined}
    />
  </FieldShell>
);

type Choice = { value: string; label: string };

type ChoiceGroupProps = {
  field: string;
  legend: string;
  help?: string;
  optional?: boolean;
  options: Choice[];
  value: string | string[];
  multiple?: boolean;
  onChange: (value: string) => void;
  errors: InquiryFieldErrors;
};

export const ChoiceGroup = ({
  field,
  legend,
  help,
  optional = false,
  options,
  value,
  multiple = false,
  onChange,
  errors,
}: ChoiceGroupProps) => {
  const error = errors[field];
  const selectedValues = Array.isArray(value) ? value : [value];

  return (
    <fieldset
      className="inquiry-choice-group"
      data-field={field}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `inquiry-${field}-error` : undefined}
    >
      <div className="inquiry-field__heading">
        <legend>{legend}</legend>
        <span>{optional ? 'Optional' : 'Required'}</span>
      </div>
      {help ? <p className="inquiry-field__help">{help}</p> : null}
      <div className="inquiry-choice-grid">
        {options.map((option) => (
          <label className="inquiry-choice" key={option.value}>
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={field}
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={() => onChange(option.value)}
            />
            <span className="inquiry-choice__marker" aria-hidden="true" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="inquiry-field__error" id={`inquiry-${field}-error`}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
};
