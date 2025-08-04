import { POST as updateHandler } from '../route';
import { updateChatTitle } from '@/models/dbOperations';

jest.mock('@/models/dbOperations', () => ({
  updateChatTitle: jest.fn(),
}));

describe('POST /api/update-title', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update chat title successfully', async () => {
    (updateChatTitle as jest.Mock).mockResolvedValue(true);

    const request = new Request('http://localhost/api/update-title', {
      method: 'POST',
      body: JSON.stringify({ 
        chatId: 'chat123', 
        title: 'New Title' 
      }),
    });

    const response = await updateHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updateChatTitle).toHaveBeenCalledWith('chat123', 'New Title');
  });

  it('should handle update errors', async () => {
    (updateChatTitle as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = new Request('http://localhost/api/update-title', {
      method: 'POST',
      body: JSON.stringify({ 
        chatId: 'chat123', 
        title: 'New Title' 
      }),
    });

    const response = await updateHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed');
  });
});