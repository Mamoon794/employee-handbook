import { GET as companyInfoHandler } from '../route';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getClerkUser } from '@/models/dbOperations';

const mockSignedOutAuth = {
  userId: null,
  sessionClaims: null,
  sessionId: null,
  sessionStatus: 'unauthenticated',
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  organization: null,
  tokenType: null,
  orgPermissions: null,
  factorVerificationAge: 0,
  getToken: jest.fn(),
  has: jest.fn().mockReturnValue(false),
  debug: jest.fn(),
  toAuth: jest.fn(),
  isSignedIn: false,
  isAuthenticated: false,
};

const mockSignedInAuth = {
  userId: 'user123',
  sessionClaims: {
    iss: 'clerk',
    sid: 'session123',
    sub: 'user123',
    iat: Date.now(),
    exp: Date.now() + 3600,
    nbf: Date.now(),
  },
  sessionId: 'session123',
  sessionStatus: 'active',
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  organization: null,
  tokenType: 'cookie',
  orgPermissions: null,
  factorVerificationAge: 0,
  getToken: jest.fn().mockResolvedValue('mock-token'),
  has: jest.fn().mockReturnValue(true),
  debug: jest.fn(),
  toAuth: jest.fn(),
  isSignedIn: true,
  isAuthenticated: true,
};

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(),
}));

jest.mock('@/models/dbOperations', () => ({
  getClerkUser: jest.fn(),
}));

const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;

describe('GET /api/getCompanyInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when unauthenticated', async () => {
    const request = new NextRequest('http://localhost/api/getCompanyInfo');
    mockGetAuth.mockReturnValue(mockSignedOutAuth as any);
    
    const response = await companyInfoHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return company info', async () => {
    const request = new NextRequest('http://localhost/api/getCompanyInfo');
    mockGetAuth.mockReturnValue(mockSignedInAuth as any);
    
    (getClerkUser as jest.Mock).mockResolvedValue([{ 
      companyId: 'comp123', 
      companyName: 'TestCo' 
    }]);
    
    const response = await companyInfoHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.companyId).toBe('comp123');
  });
});

// import { GET as companyInfoHandler } from '../route';
// import { getAuth } from '@clerk/nextjs/server';
// import { NextRequest } from 'next/server';

// jest.mock('@clerk/nextjs/server', () => ({
//   getAuth: jest.fn(),
// }));

// jest.mock('@/models/dbOperations', () => ({
//   getClerkUser: jest.fn(),
// }));

// const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;

// describe('GET /api/getCompanyInfo', () => {
//   it('should return 401 when unauthenticated', async () => {
//     const request = new NextRequest('http://localhost/api/getCompanyInfo');
//     mockGetAuth.mockReturnValue({ userId: null } as any);
    
//     const response = await companyInfoHandler(request);
//     const data = await response.json();
    
//     expect(response.status).toBe(401);
//     expect(data.error).toBe('Unauthorized');
//   });

//   it('should return company info', async () => {
//     const request = new NextRequest('http://localhost/api/getCompanyInfo');
//     mockGetAuth.mockReturnValue({ userId: 'user123' } as any);
    
//     const { getClerkUser } = require('@/models/dbOperations');
//     getClerkUser.mockResolvedValue([{ 
//       companyId: 'comp123', 
//       companyName: 'TestCo' 
//     }]);
    
//     const response = await companyInfoHandler(request);
//     const data = await response.json();
    
//     expect(response.status).toBe(200);
//     expect(data.companyId).toBe('comp123');
//   });
// });