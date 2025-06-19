// // src/types/clerk.d.ts
// import type { UserType } from '@/models/schema';

// declare module '@clerk/nextjs' {
//   interface UserPublicMetadata {
//     role?: UserType;
//     companyName?: string;
//     province?: string;
//     isSubscribed?: boolean;
//     phoneNumber?: string;
//   }

//   interface SignUpPublicMetadata {
//     role?: UserType;
//     companyName?: string;
//     province?: string;
//     isSubscribed?: boolean;
//     phoneNumber?: string;
//   }
// }

// // For React components
// declare module '@clerk/types' {
//   interface UserPublicMetadata {
//     role?: UserType;
//     companyName?: string;
//     province?: string;
//     isSubscribed?: boolean;
//     phoneNumber?: string;
//   }
// }