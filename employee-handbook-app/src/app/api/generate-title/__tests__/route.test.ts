import { POST as generateHandler } from '../route';

global.fetch = jest.fn();

jest.mock('@/dbConfig/firebaseConfig', () => {
  return {
    db: {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
      set: jest.fn(),
    },
    serviceAccount: {
      project_id: 'test-project',
      private_key: 'test-key',
      client_email: 'test@example.com',
    }
  };
});

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
      })),
    })),
  })),
}));

jest.mock('@/models/dbOperations', () => ({
  updateChatTitle: jest.fn(),
}));

describe('POST /api/generate-title', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_SERVICE_URL = 'http://ai-service';
  });

  it('should generate title for private chat', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ title: 'Generated Title' }),
    });

    const { updateChatTitle } = require('@/models/dbOperations');
    updateChatTitle.mockResolvedValue(true);

    const request = new Request('http://localhost/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Test message', 
        chatId: 'chat123', 
        userId: 'user123' 
      }),
    });

    const response = await generateHandler(request);
    const data = await response.json();
    
    expect(data.title).toBe('Generated Title');
    expect(updateChatTitle).toHaveBeenCalled();
  });

  it('should return default title on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    const request = new Request('http://localhost/api/generate-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Test message', 
        chatId: 'chat123', 
        userId: 'user123' 
      }),
    });

    const response = await generateHandler(request);
    const data = await response.json();
    
    expect(data.title).toBe('New Chat');
    expect(data.error).toContain('Failed');
  });
});