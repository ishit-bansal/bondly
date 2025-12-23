import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch session and both responses
    const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { data: responses } = await supabase.from("responses").select("*").eq("session_id", sessionId)

    if (!responses || responses.length !== 2) {
      return NextResponse.json({ error: "Both responses required" }, { status: 400 })
    }

    const creatorResponse = responses.find((r) => r.is_creator)
    const partnerResponse = responses.find((r) => !r.is_creator)

    if (!creatorResponse || !partnerResponse) {
      return NextResponse.json({ error: "Missing responses" }, { status: 400 })
    }

    // Generate advice for creator
    const creatorAdvice = await generateAdvice({
      theirName: session.creator_name,
      theirPerspective: creatorResponse.situation_description,
      theirFeelings: creatorResponse.feelings,
      theirEmotions: creatorResponse.emotional_state,
      partnerName: session.partner_name,
      partnerPerspective: partnerResponse.situation_description,
      partnerFeelings: partnerResponse.feelings,
      partnerEmotions: partnerResponse.emotional_state,
    })

    // Generate advice for partner
    const partnerAdvice = await generateAdvice({
      theirName: session.partner_name,
      theirPerspective: partnerResponse.situation_description,
      theirFeelings: partnerResponse.feelings,
      theirEmotions: partnerResponse.emotional_state,
      partnerName: session.creator_name,
      partnerPerspective: creatorResponse.situation_description,
      partnerFeelings: creatorResponse.feelings,
      partnerEmotions: creatorResponse.emotional_state,
    })

    // Store advice in database using service role key
    const supabaseAdmin = await createClient()

    await supabaseAdmin.from("advice").insert([
      {
        session_id: sessionId,
        user_id: creatorResponse.user_id,
        is_creator: true,
        advice_text: creatorAdvice.advice,
        conversation_starters: creatorAdvice.conversationStarters,
        action_steps: creatorAdvice.actionSteps,
      },
      {
        session_id: sessionId,
        user_id: partnerResponse.user_id,
        is_creator: false,
        advice_text: partnerAdvice.advice,
        conversation_starters: partnerAdvice.conversationStarters,
        action_steps: partnerAdvice.actionSteps,
      },
    ])

    // Update session status
    await supabase.from("sessions").update({ status: "analyzed" }).eq("id", sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error analyzing session:", error)
    return NextResponse.json({ error: "Failed to analyze session" }, { status: 500 })
  }
}

async function generateAdvice(input: {
  theirName: string
  theirPerspective: string
  theirFeelings: string
  theirEmotions: string[]
  partnerName: string
  partnerPerspective: string
  partnerFeelings: string
  partnerEmotions: string[]
}) {
  const prompt = `You are a compassionate relationship counselor. Two partners are having a conflict and have shared their perspectives.

**${input.theirName}'s Perspective:**
Situation: ${input.theirPerspective}
Feelings: ${input.theirFeelings}
Emotions: ${input.theirEmotions.join(", ")}

**${input.partnerName}'s Perspective:**
Situation: ${input.partnerPerspective}
Feelings: ${input.partnerFeelings}
Emotions: ${input.partnerEmotions.join(", ")}

Generate personalized advice for ${input.theirName}. Your advice should:
1. Validate ${input.theirName}'s feelings and show empathy
2. Help them understand ${input.partnerName}'s perspective
3. Provide 3-4 actionable steps to improve the situation
4. Suggest 3-4 conversation starters to facilitate healthy dialogue
5. Use a warm, supportive, non-judgmental tone

Format your response as JSON with this structure:
{
  "advice": "Main advice text (2-3 paragraphs)",
  "actionSteps": ["Step 1", "Step 2", "Step 3"],
  "conversationStarters": ["Starter 1", "Starter 2", "Starter 3"]
}`

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Parse the JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response")
  }

  return JSON.parse(jsonMatch[0])
}
