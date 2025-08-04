import '@testing-library/jest-dom';

declare global {
  var NextRequest: any;
}

class MockNextRequest extends Request {
  constructor(input: RequestInfo, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(this.url);
    this.cookies = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      getAll: jest.fn(),
    };
    this.page = {};
    this.ua = {};
  }
  
  nextUrl: URL;
  cookies: any;
  page: any;
  ua: any;
}

global.NextRequest = MockNextRequest as any;
jest.mock('punycode', () => ({}), { virtual: true });