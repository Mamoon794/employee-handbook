import { NextRequest } from 'next/server';
import { POST as bulletPointsHandler } from '../bullet-points/route';
import { POST as employeeDistributionHandler } from '../employee-distribution/route';
import { POST as employeeRegistrationHandler } from '../employee-registration/route';
import { POST as questionsAskedHandler } from '../questions-asked/route';

jest.mock('../util', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import callAI from '../util';
const mockCallAI = callAI as jest.MockedFunction<typeof callAI>;

describe('AI Summary Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCallAI.mockResolvedValue('Mocked AI response');
  });

  describe('POST /api/ai-summary/bullet-points', () => {
    it('should process valid summary data', async () => {
      const validData = {
        summary: 'Your workforce spans 2 provinces with Ontario leading at 9 employees (81.8%), followed by Nova Scotia with 1 employee (9.1%).'
      };

      const request = new NextRequest('http://localhost/api/ai-summary/bullet-points', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await bulletPointsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('Mocked AI response');
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('Summarize the following text into clear, concise bullet points')
      );
    });

    it('should handle empty summary data', async () => {
      const emptyData = { summary: '' };

      const request = new NextRequest('http://localhost/api/ai-summary/bullet-points', {
        method: 'POST',
        body: JSON.stringify(emptyData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await bulletPointsHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('')
      );
    });

    it('should handle missing summary field', async () => {
      const invalidData = {};

      const request = new NextRequest('http://localhost/api/ai-summary/bullet-points', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await bulletPointsHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('undefined')
      );
    });

    it('should handle AI service errors gracefully', async () => {
      mockCallAI.mockRejectedValue(new Error('AI service error'));

      const validData = { summary: 'Test summary' };
      const request = new NextRequest('http://localhost/api/ai-summary/bullet-points', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await bulletPointsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('No ai generated bullet points available.');
    });
  });

  describe('POST /api/ai-summary/employee-distribution', () => {

    it('should handle empty province data array', async () => {
      const emptyData = { provinceData: [] };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-distribution', {
        method: 'POST',
        body: JSON.stringify(emptyData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeDistributionHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('[]')
      );
    });

    it('should handle malformed province data', async () => {
      const malformedData = {
        provinceData: [
          { province: 'Ontario', count: 'invalid', percentage: null },
          { province: '', count: 5 } // missing percentage
        ]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-distribution', {
        method: 'POST',
        body: JSON.stringify(malformedData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeDistributionHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('invalid')
      );
    });
  });

  describe('POST /api/ai-summary/employee-registration', () => {
    it('should process valid employee registration data', async () => {
      const validData = {
        employeeRegistrationData: [
          { time: 'June 2025', employees: 19 },
          { time: 'July 2025', employees: 7 }
        ]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-registration', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeRegistrationHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('Mocked AI response');
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('Analyze the following dataset')
      );
    });

    it('should handle empty registration data array', async () => {
      const emptyData = { employeeRegistrationData: [] };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-registration', {
        method: 'POST',
        body: JSON.stringify(emptyData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeRegistrationHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('[]')
      );
    });

    it('should handle malformed registration data', async () => {
      const malformedData = {
        employeeRegistrationData: [
          { time: 'June 2025', employees: 'invalid' },
          { time: '', employees: -5 },
          { employees: 10 } // missing time
        ]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-registration', {
        method: 'POST',
        body: JSON.stringify(malformedData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeRegistrationHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('invalid')
      );
    });

    it('should handle AI service errors gracefully', async () => {
      mockCallAI.mockRejectedValue(new Error('AI service error'));

      const validData = {
        employeeRegistrationData: [{ time: 'June 2025', employees: 19 }]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-registration', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeRegistrationHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('No ai summary for employee registration available.');
    });
  });

  describe('POST /api/ai-summary/questions-asked', () => {
    it('should process valid questions asked data', async () => {
      const validData = {
        questionsAskedData: [
          { time: 'June 2025', questions: 32 },
          { time: 'July 2025', questions: 57 }
        ]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/questions-asked', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await questionsAskedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('Mocked AI response');
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('Given this dataset')
      );
    });

    it('should handle empty questions data array', async () => {
      const emptyData = { questionsAskedData: [] };

      const request = new NextRequest('http://localhost/api/ai-summary/questions-asked', {
        method: 'POST',
        body: JSON.stringify(emptyData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await questionsAskedHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('[]')
      );
    });

    it('should handle malformed questions data', async () => {
      const malformedData = {
        questionsAskedData: [
          { time: 'June 2025', questions: 'invalid' },
          { time: null, questions: 25 },
          { time: 'July 2025' } // missing questions
        ]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/questions-asked', {
        method: 'POST',
        body: JSON.stringify(malformedData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await questionsAskedHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('invalid')
      );
    });

    it('should handle AI service errors gracefully', async () => {
      mockCallAI.mockRejectedValue(new Error('AI service error'));

      const validData = {
        questionsAskedData: [{ time: 'June 2025', questions: 32 }]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/questions-asked', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await questionsAskedHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('No ai summary available for questions asked.');
    });
  });

  describe('Data Validation & Error Handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/ai-summary/bullet-points', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await bulletPointsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('No ai generated bullet points available.');
    });

    it('should handle null values in data', async () => {
      const nullData = {
        provinceData: null
      };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-distribution', {
        method: 'POST',
        body: JSON.stringify(nullData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeDistributionHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('null')
      );
    });

    it('should handle very large datasets', async () => {
      const largeData = {
        provinceData: Array.from({ length: 1000 }, (_, i) => ({
          province: `Province${i}`,
          count: i + 1,
          percentage: (i + 1) / 10
        }))
      };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-distribution', {
        method: 'POST',
        body: JSON.stringify(largeData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeDistributionHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalled();
    });

    it('should handle mixed data types in arrays', async () => {
      const mixedData = {
        employeeRegistrationData: [
          { time: 'June 2025', employees: 19 },
          'invalid string entry',
          { time: 123, employees: 'text' },
          null,
          { time: 'July 2025', employees: 7 }
        ]
      };

      const request = new NextRequest('http://localhost/api/ai-summary/employee-registration', {
        method: 'POST',
        body: JSON.stringify(mixedData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await employeeRegistrationHandler(request);

      expect(response.status).toBe(200);
      expect(mockCallAI).toHaveBeenCalledWith(
        expect.stringContaining('invalid string entry')
      );
    });
  });
}); 