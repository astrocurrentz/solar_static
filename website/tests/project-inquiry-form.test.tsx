// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectInquiryForm from '../src/components/project-inquiry/ProjectInquiryForm';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

Element.prototype.scrollIntoView = vi.fn();

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

    await user.type(
      await screen.findByLabelText('How will success be judged?'),
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
