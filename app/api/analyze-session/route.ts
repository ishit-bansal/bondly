import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log("[API] ===== ANALYZE SESSION START =====")
  
  try {
    const body = await request.json()
    const sessionId = body.sessionId
    
    console.log("[API] Received sessionId:", sessionId)
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Use service role to bypass RLS and see all responses
    const supabase = await createClient(true)
    console.log("[API] Supabase client created (service role)")

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !sessionData) {
      console.error("[API] Session error:", sessionError)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    console.log("[API] Session found:", sessionData.creator_name, "&", sessionData.partner_name)

    // Get responses - wait a bit for DB to catch up
    let responses = null
    let attempts = 0
    
    while (attempts < 10) {
      const { data, error } = await supabase
        .from("responses")
        .select("*")
        .eq("session_id", sessionId)

      if (error) {
        console.error("[API] Query error:", error)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      console.log(`[API] Attempt ${attempts + 1}: Found ${data?.length || 0} responses`)
      
      if (data && data.length > 0) {
        console.log(`[API] Response details:`, data.map(r => ({
          id: r.id,
          is_creator: r.is_creator,
          user_id: r.user_id?.substring(0, 8) + "...",
          has_situation: !!r.situation_description
        })))
      }

      if (data && data.length >= 2) {
        responses = data
        break
      }

      if (attempts < 9) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      attempts++
    }

    if (!responses || responses.length < 2) {
      console.error("[API] Not enough responses after retries:", responses?.length)
      return NextResponse.json({ 
        error: "Both responses required. Please wait a moment and try again.",
        found: responses?.length || 0
      }, { status: 400 })
    }

    console.log("[API] Both responses found!")

    const creator = responses.find(r => r.is_creator)
    const partner = responses.find(r => !r.is_creator)

    if (!creator || !partner) {
      return NextResponse.json({ error: "Missing creator or partner response" }, { status: 400 })
    }

    console.log("[API] Calling Gemini API for both partners...")

    // Generate advice for both (in parallel)
    const [creatorAdvice, partnerAdvice] = await Promise.all([
      generateAdvice(sessionData.creator_name, creator, sessionData.partner_name, partner),
      generateAdvice(sessionData.partner_name, partner, sessionData.creator_name, creator)
    ])

    console.log("[API] Advice generated, saving to database...")

    // Save advice
    const { error: insertError } = await supabase.from("advice").insert([
      {
        session_id: sessionId,
        user_id: creator.user_id,
        is_creator: true,
        advice_text: creatorAdvice.advice,
        conversation_starters: creatorAdvice.conversationStarters || [],
        action_steps: creatorAdvice.actionSteps || [],
      },
      {
        session_id: sessionId,
        user_id: partner.user_id,
        is_creator: false,
        advice_text: partnerAdvice.advice,
        conversation_starters: partnerAdvice.conversationStarters || [],
        action_steps: partnerAdvice.actionSteps || [],
      },
    ])

    if (insertError) {
      console.error("[API] Insert error:", insertError)
      return NextResponse.json({ error: "Failed to save advice" }, { status: 500 })
    }

    // Update session
    await supabase
      .from("sessions")
      .update({ status: "analyzed" })
      .eq("id", sessionId)

    console.log("[API] ===== ANALYZE SESSION SUCCESS =====")
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("[API] ===== ANALYZE SESSION ERROR =====")
    console.error("[API] Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message 
    }, { status: 500 })
  }
}

async function generateAdvice(
  theirName: string,
  theirResponse: any,
  partnerName: string,
  partnerResponse: any
) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set")
  }

  const prompt = `You are a compassionate relationship counselor. Two partners shared their perspectives:

${theirName}'s situation: ${theirResponse.situation_description}
${theirName}'s feelings: ${theirResponse.feelings}
${theirName}'s emotions: ${(theirResponse.emotional_state || []).join(", ") || "Not specified"}

${partnerName}'s situation: ${partnerResponse.situation_description}
${partnerName}'s feelings: ${partnerResponse.feelings}
${partnerName}'s emotions: ${(partnerResponse.emotional_state || []).join(", ") || "Not specified"}

Provide empathetic advice for ${theirName}. Return ONLY valid JSON:
{"advice": "2-3 paragraphs", "actionSteps": ["step1", "step2", "step3"], "conversationStarters": ["starter1", "starter2", "starter3"]}`

  console.log(`[API] Calling Gemini for ${theirName}...`)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[API] Gemini error:", response.status, errorText)
    throw new Error(`Gemini API failed: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error("No text in Gemini response")
  }

  console.log(`[API] Gemini response received for ${theirName}`)

  // Parse JSON
  let jsonStr = text.trim()
  
  // Remove markdown if present
  if (jsonStr.includes("```")) {
    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "")
  }

  const match = jsonStr.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error("No JSON found in response")
  }

  try {
    return JSON.parse(match[0])
  } catch (e) {
    console.error("[API] JSON parse error:", e)
    // Fallback
    return {
      advice: `${theirName}, I understand this is challenging. Your feelings are valid. Try to communicate openly with ${partnerName} and focus on understanding each other.`,
      actionSteps: [
        "Take time to calm down before discussing",
        "Use 'I feel' statements instead of blame",
        "Listen to understand, not to respond"
      ],
      conversationStarters: [
        "I'd like to understand your perspective better.",
        "Can we talk about how to move forward?",
        "I care about us and want to work through this."
      ]
    }
  }
}
