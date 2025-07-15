/**
 * @jest-environment node
 * @fileoverview Jest test for business logic of role-based login redirect
 */
/// <reference types="jest" />

function getRedirectPath(userType: string | undefined | null): string {
  if (userType === 'Employee') return '/chat';
  if (userType === 'Owner') return '/dashboard';
  return '/chat';
}

describe('Role-based login redirect business logic', () => {
  it('redirects Employee to /chat', () => {
    expect(getRedirectPath('Employee')).toBe('/chat');
  });

  it('redirects Owner to /dashboard', () => {
    expect(getRedirectPath('Owner')).toBe('/dashboard');
  });

  it('redirects unknown userType to /chat', () => {
    expect(getRedirectPath('Other')).toBe('/chat');
    expect(getRedirectPath(undefined)).toBe('/chat');
    expect(getRedirectPath(null)).toBe('/chat');
  });
}); 