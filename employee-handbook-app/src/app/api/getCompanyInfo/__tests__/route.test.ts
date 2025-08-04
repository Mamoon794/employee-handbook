import { GET as companyInfoHandler } from '../route';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
}));

jest.mock('@/models/dbOperations', () => ({
  getClerkUser: jest.fn(),
}));

const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;

describe('GET /api/getCompanyInfo', () => {
  it('should return 401 when unauthenticated', async () => {
    const request = new NextRequest('http://localhost/api/getCompanyInfo');
    mockGetAuth.mockReturnValue({ userId: null } as any);
    
    const response = await companyInfoHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return company info', async () => {
    const request = new NextRequest('http://localhost/api/getCompanyInfo');
    mockGetAuth.mockReturnValue({ userId: 'user123' } as any);
    
    const { getClerkUser } = require('@/models/dbOperations');
    getClerkUser.mockResolvedValue([{ 
      companyId: 'comp123', 
      companyName: 'TestCo' 
    }]);
    
    const response = await companyInfoHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.companyId).toBe('comp123');
  });
});