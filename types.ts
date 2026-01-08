export type UserStatus = 'pending' | 'approved' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  academy: string;
  status: UserStatus;
}

export interface InstructorInfo {
  name: string;
  role: string;
  profileImageUrl: string;
  bio: string;
  achievements: string[];
}

export interface CourseContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface ResourceFile {
  id: string;
  name: string;
  description: string;
  url: string;
  date: string;
}

export interface ReviewVideo {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  order?: number;
}

export interface QnAPost {
  id: string;
  title: string;
  author: string;
  content: string;
  date: string;
  replies: QnAReply[];
}

export interface QnAReply {
  id: string;
  author: string;
  content: string;
  date: string;
}

export interface UserActivity {
  userName: string;
  type: string;
  detail: string;
  timestamp: string;
}

export interface AnalyticsData {
  visits: number;
  videoViews: number;
  downloads: number;
  activities?: UserActivity[];
}
