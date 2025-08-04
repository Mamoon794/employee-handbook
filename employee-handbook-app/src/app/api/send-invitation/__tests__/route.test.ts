import { POST as sendHandler } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/models/dbOperations', () => ({
  createInvitation: jest.fn(),
  getUserByEmail: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendInvitationEmail: jest.fn(),
}));

describe('POST /api/send-invitation', () => {

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/send-invitation', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await sendHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should send invitation successfully', async () => {
    const { createInvitation, getUserByEmail } = require('@/models/dbOperations');
    const { sendInvitationEmail } = require('@/lib/email');
    
    getUserByEmail.mockResolvedValue({ 
      email: 'test@example.com', 
      companyId: null 
    });
    
    createInvitation.mockResolvedValue({ id: 'invite123' });

    const request = new NextRequest('http://localhost/api/send-invitation', {
      method: 'POST',
      body: JSON.stringify({ 
        email: 'test@example.com', 
        companyId: 'comp123',
        companyName: 'TestCo',
        userId: 'user123'
      }),
    });

    const response = await sendHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(sendInvitationEmail).toHaveBeenCalled();
  });
});