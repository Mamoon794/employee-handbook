import { GET as acceptHandler } from '../route';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
}));

jest.mock('@/models/dbOperations', () => ({
  getInvitation: jest.fn(),
  updateInvitationStatus: jest.fn(),
  getClerkUser: jest.fn(),
}));

jest.mock('@/dbConfig/firebaseConfig', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn(),
      })),
    })),
  },
}));

const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;

describe('GET /api/accept-invitation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect when invitationId is missing', async () => {
    const request = new NextRequest('http://localhost/api/accept-invitation');
    const response = await acceptHandler(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/invalid-invitation');
  });

  it('should redirect when invitation not found', async () => {
    const request = new NextRequest('http://localhost/api/accept-invitation?invitationId=123');
    const { getInvitation } = require('@/models/dbOperations');
    getInvitation.mockResolvedValue(null);
    
    const response = await acceptHandler(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/invalid-invitation');
  });

  it('should redirect to login when unauthenticated', async () => {
    const request = new NextRequest('http://localhost/api/accept-invitation?invitationId=123');
    const { getInvitation } = require('@/models/dbOperations');
    getInvitation.mockResolvedValue({ status: 'pending' });
    mockGetAuth.mockReturnValue({ userId: null } as any);
    
    const response = await acceptHandler(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/log-in');
  });

  it('should update user and redirect on success', async () => {
    const request = new NextRequest('http://localhost/api/accept-invitation?invitationId=123');
    const { getInvitation, getClerkUser } = require('@/models/dbOperations');
    
    getInvitation.mockResolvedValue({ 
      status: 'pending', 
      email: 'test@example.com',
      companyId: 'company1',
      companyName: 'TestCo'
    });
    
    mockGetAuth.mockReturnValue({ userId: 'user123' } as any);
    getClerkUser.mockResolvedValue([{ 
      id: 'user123', 
      email: 'test@example.com' 
    }]);
    
    const response = await acceptHandler(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/chat?welcome=true');
    expect(require('@/models/dbOperations').updateInvitationStatus).toHaveBeenCalled();
  });
});