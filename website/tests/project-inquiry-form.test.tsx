// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectInquiryForm from '../src/components/project-inquiry/ProjectInquiryForm';
import { InquiryStep } from '../src/components/project-inquiry/InquirySteps';
import {
  createEmptyInquiryState,
  type ProjectInquiryFormState,
} from '../src/data/project-inquiry-types';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

Element.prototype.scrollIntoView = vi.fn();

const InquiryStepHarness = ({ step }: { step: number }) => {
  const [state, setState] = useState(createEmptyInquiryState);
  const updateField = <K extends keyof ProjectInquiryFormState>(
    field: K,
    value: ProjectInquiryFormState[K],
  ) => setState((current) => ({ ...current, [field]: value }));

  return (
    <InquiryStep
      step={step}
      state={state}
      errors={{}}
      updateField={updateField}
    />
  );
};

describe('ProjectInquiryForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('validates the current chapter and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    render(createElement(ProjectInquiryForm));

    await user.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please review the highlighted fields',
    );
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
  });

  it('shows fixed-deadline options and clears dependent custom values', async () => {
    const user = userEvent.setup();
    render(<InquiryStepHarness step={3} />);

    await user.click(screen.getByLabelText('Yes, the date cannot move'));
    const launchReason = screen.getByLabelText(
      'Public launch, event, or go-live date',
    );
    const customReason = screen.getByLabelText('Something else — add my own');

    await user.click(launchReason);
    await user.click(customReason);
    expect(launchReason).toBeChecked();
    expect(customReason).toBeChecked();

    const customInput = screen.getByLabelText('Add your constraint');
    expect(customInput).toHaveAttribute('maxlength', '500');
    await user.type(customInput, 'A partner launch date.');
    await user.click(customReason);
    expect(screen.queryByLabelText('Add your constraint')).toBeNull();

    await user.click(customReason);
    expect(screen.getByLabelText('Add your constraint')).toHaveValue('');
    await user.click(screen.getByLabelText('No, the timing is flexible'));
    expect(
      screen.queryByLabelText('Public launch, event, or go-live date'),
    ).toBeNull();
  });

  it('supports multiple success outcomes and preserves optional details', async () => {
    const user = userEvent.setup();
    render(<InquiryStepHarness step={4} />);

    const brandOutcome = screen.getByLabelText(
      'Brand — stronger recognition, trust, or consistency',
    );
    const customOutcome = screen.getByLabelText(
      'Another outcome or specific KPI — add my own',
    );
    const details = screen.getByLabelText(
      'Add a target or explain what success looks like',
    );

    await user.click(brandOutcome);
    await user.click(customOutcome);
    expect(brandOutcome).toBeChecked();
    expect(customOutcome).toBeChecked();
    expect(details).toHaveAttribute('maxlength', '1000');

    await user.type(details, 'Increase qualified inquiries by 20%.');
    await user.click(customOutcome);
    expect(customOutcome).not.toBeChecked();
    expect(details).toHaveValue('Increase qualified inquiries by 20%.');
  });

  it('completes the five chapters, submits, and clears the draft', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, referenceCode: 'SSS-TEST1234' }),
          { status: 201 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    render(createElement(ProjectInquiryForm));

    await user.type(await screen.findByLabelText('Name'), 'Avery Signal');
    await user.type(
      screen.getByLabelText('Organization / project'),
      'North Star',
    );
    await user.type(screen.getByLabelText('Email'), 'avery@example.com');
    await user.click(screen.getByLabelText('I am the final decision-maker'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.type(
      await screen.findByLabelText('What is the idea or project?'),
      'A new digital service.',
    );
    await user.type(
      screen.getByLabelText('What outcome do you want?'),
      'A clear launch-ready experience.',
    );
    await user.type(
      screen.getByLabelText('Who is the primary audience or user?'),
      'Independent publishers.',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.click(
      await screen.findByLabelText('Brand direction or visual identity'),
    );
    await user.click(screen.getByLabelText('Nothing yet'));
    await user.click(
      screen.getByLabelText('Content will be a shared responsibility'),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.click(
      await screen.findByLabelText('No, the timing is flexible'),
    );
    await user.click(screen.getByLabelText('CAD 5–8k'));
    await user.type(
      screen.getByLabelText(
        'Who will review the work, and who has final approval?',
      ),
      'Avery gives final approval.',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.click(
      await screen.findByLabelText(
        'Brand — stronger recognition, trust, or consistency',
      ),
    );
    await user.type(
      screen.getByLabelText('Add a target or explain what success looks like'),
      'The right clients understand the offer.',
    );
    await user.click(screen.getByLabelText('No ongoing support expected'));
    await user.click(screen.getByRole('button', { name: 'Review inquiry' }));

    await user.click(
      await screen.findByLabelText(
        /I agree that Solar Static Studio may use this information/,
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }));

    expect(
      await screen.findByRole('heading', { name: 'Thank you for the signal.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('SSS-TEST1234')).toBeInTheDocument();
    expect(localStorage.getItem('sss.projectInquiry.v1')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    ) as { value: { successCriteria: string } };
    expect(requestBody.value.successCriteria).toBe(
      'Brand — stronger recognition, trust, or consistency; Details: The right clients understand the offer.',
    );
  });

  it('restores a saved draft from the current schema', async () => {
    localStorage.setItem(
      'sss.projectInquiry.v1',
      JSON.stringify({
        schemaVersion: 1,
        state: {
          schemaVersion: 1,
          idempotencyKey: '2f0ad98a-4508-4b9e-80cf-908a16c7283a',
          startedAt: new Date().toISOString(),
          name: 'Restored Name',
        },
        currentStep: 0,
        reviewing: false,
      }),
    );

    await act(async () => render(createElement(ProjectInquiryForm)));

    expect(
      await screen.findByDisplayValue('Restored Name'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Draft restored');
  });
});
