export interface Event {
  id: string
  user_id: string
  title: string
  date: string
  location: string
  description: string
  cover_image_url: string | null
  privacy: 'public' | 'link-only' | 'invite-only'
  plus_one_rule: 'none' | 'ask' | 'allowed'
  event_type: 'birthday' | 'dinner' | 'rooftop' | 'housewarming' | 'general'
  slug: string
  created_at: string
  deleted_at: string | null
}

export interface Rsvp {
  id: string
  event_id: string
  user_id: string | null
  guest_name: string
  guest_email: string
  status: 'yes' | 'no' | 'maybe'
  maybe_reason: 'schedule_conflict' | 'waiting_plus_one' | 'arriving_late' | 'need_more_info' | null
  plus_one: boolean
  created_at: string
  deleted_at: string | null
}

export interface HostBrief {
  total_yes: number
  total_no: number
  total_maybe: number
  unresolved_maybes: Rsvp[]
  pending_plus_ones: Rsvp[]
  likely_attendance: number
}

export interface User {
  id: string
  email: string
}
