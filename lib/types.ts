export interface Session {
  id: string
  creator_id: string
  creator_name: string
  partner_name: string | null
  status: "waiting_for_partner" | "completed" | "analyzed"
  share_token: string
  created_at: string
  updated_at: string
}

export interface Response {
  id: string
  session_id: string
  user_id: string
  is_creator: boolean
  situation_description: string
  feelings: string
  emotional_state: string[]
  created_at: string
}

export interface Advice {
  id: string
  session_id: string
  user_id: string
  is_creator: boolean
  advice_text: string
  conversation_starters: string[]
  action_steps: string[]
  created_at: string
}
