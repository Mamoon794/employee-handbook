import { GET as getPendingHandler } from '../route';

jest.mock('@/models/dbOperations', () => ({
  getPendingInvitationsByCompany: jest.fn(),
}));

describe('GET /api/get-pending-invites', () => {
  it('should require companyId parameter', async () => {
    const request = new Request('http://localhost/api/get-pending-invites');
    const response = await getPendingHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should return pending invites', async () => {
    const { getPendingInvitationsByCompany } = require('@/models/dbOperations');
    getPendingInvitationsByCompany.mockResolvedValue([{ id: 'invite1' }]);

    const request = new Request('http://localhost/api/get-pending-invites?companyId=comp123');
    const response = await getPendingHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([{ id: 'invite1' }]);
  });
});