export type CharacterStage =
  | 'pure'
  | 'whisper'
  | 'ghost'
  | 'slave'
  | 'zombie'
  | 'machine'
  | 'dog'
  | 'banned';
export type PostType = 'normal' | 'daily' | 'elimination';
export type ReactionType = 'wakaru';
export type ContaminationSource = 'manual' | 'reminder' | 'post';
export type ChickenRaceStatus = 'preseason' | 'alive' | 'eliminated' | 'completed';
export type SeasonStatus = 'preseason' | 'active' | 'finished';
export type CompanyStatus = 'pending' | 'es_submitted' | 'in_progress' | 'done';
export type EventType = 'es' | 'briefing' | 'internship_short' | 'internship_long' | 'ob_visit' | 'spi' | 'interview' | 'other';
export type EventStatus = 'pending' | 'done' | 'skipped' | 'ignored';
export type ActionType = 'es' | 'briefing' | 'internship_short' | 'internship_long' | 'ob_visit' | 'spi' | 'suit' | 'naitei';

export interface User {
  user_id: string;
  nickname: string;
  contact_email: string;
  university?: string;
  faculty?: string;
  grade?: number;
  contamination_pt: number;
  character_stage: CharacterStage;
  streak_days: number;
  is_banned: boolean;
  show_contamination: boolean;
  show_university: boolean;
  notif_obituary: boolean;
  notif_reminder: boolean;
  notif_parent_bot: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface Post {
  post_id: string;
  user_id: string;
  user: UserSummary;
  content: string;
  image_url?: string;
  post_type: PostType;
  daily_skip?: string;
  daily_instead?: string;
  daily_comment?: string;
  reactions: ReactionSummary[];
  my_reaction?: ReactionType;
  comment_count: number;
  created_at: string;
}

export interface UserSummary {
  user_id: string;
  nickname: string;
  character_stage: CharacterStage;
  contamination_pt: number;
}

export interface ReactionSummary {
  reaction_type: ReactionType;
  count: number;
}

export interface Comment {
  comment_id: string;
  post_id: string;
  content: string;
  is_template: boolean;
  user: UserSummary | null;
  created_at: string;
}

export interface Season {
  season_id: string;
  name: string;
  theme?: string;
  status: SeasonStatus;
  started_at?: string;
  ended_at?: string;
}

export interface ChickenRaceEntry {
  entry_id: string;
  season_id: string;
  user_id: string;
  user: UserSummary;
  status: ChickenRaceStatus;
  joined_at: string;
  survived_days: number;
  eliminated_at?: string;
  elimination_reason?: string;
}

export interface CalendarEvent {
  event_id: string;
  user_id: string;
  title: string;
  event_type: EventType;
  scheduled_at: string;
  remind_before: number;
  status: EventStatus;
  completed_at?: string;
  memo?: string;
  company_id?: string;
  notif_day_before: boolean;
  notif_one_hour: boolean;
  notif_followup: boolean;
  contamination_points: number;
  created_at: string;
}

export interface Company {
  company_id: string;
  user_id: string;
  name: string;
  mypage_url?: string;
  status: CompanyStatus;
  deadline?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export interface ContaminationLog {
  log_id: string;
  user_id: string;
  action_type: ActionType;
  point_added: number;
  source: ContaminationSource;
  created_at: string;
}

export interface SurvivorStats {
  survivor_count: number;
  today_eliminated: number;
  total_members: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  nickname: string;
  email_verified: boolean;
}
