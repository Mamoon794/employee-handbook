import { GET as getAcceptedHandler } from '../route';

jest.mock('@/models/dbOperations', () => ({
  getAcceptedInvitationsByCompany: jest.fn(),
}));

describe('GET /api/get-accepted-invites', () => {
  it('should require companyId parameter', async () => {
    const request = new Request('http://localhost/api/get-accepted-invites');
    const response = await getAcceptedHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should return accepted invites', async () => {
    const { getAcceptedInvitationsByCompany } = require('@/models/dbOperations');
    getAcceptedInvitationsByCompany.mockResolvedValue([{ id: 'invite1' }]);

    const request = new Request('http://localhost/api/get-accepted-invites?companyId=comp123');
    const response = await getAcceptedHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([{ id: 'invite1' }]);
  });
});