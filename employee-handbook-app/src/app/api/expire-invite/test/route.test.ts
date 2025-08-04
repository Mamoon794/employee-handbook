import { POST as expireHandler } from '../route';
import { expireInvitation } from '@/models/dbOperations';

jest.mock('@/models/dbOperations', () => ({
  expireInvitation: jest.fn(),
}));

describe('POST /api/expire-invite', () => {
  it('should return 400 when invitationId missing', async () => {
    const request = new Request('http://localhost/api/expire-invite', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await expireHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should expire invitation successfully', async () => {
    (expireInvitation as jest.Mock).mockResolvedValue(true);

    const request = new Request('http://localhost/api/expire-invite', {
      method: 'POST',
      body: JSON.stringify({ invitationId: 'invite123' }),
    });

    const response = await expireHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(expireInvitation).toHaveBeenCalledWith('invite123');
  });
});