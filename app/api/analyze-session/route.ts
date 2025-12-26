import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Sanitize text input - remove potential XSS and limit length
function sanitizeText(text: string, maxLength = 5000): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionId = body.sessionId
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Validate UUID format to prevent injection
    if (!isValidUUID(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 })
    }

    const supabase = await createClient(true)

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Security check: Prevent re-analysis of already analyzed sessions
    if (sessionData.status === "analyzed") {
      return NextResponse.json({ error: "Session already analyzed" }, { status: 400 })
    }

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from("responses")
      .select("*")
      .eq("session_id", sessionId)

    if (responsesError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!responses || responses.length < 2) {
      return NextResponse.json({ 
        error: "Both responses required. Please wait a moment and try again.",
        found: responses?.length || 0
      }, { status: 400 })
    }

    // Handle duplicates - get the most recent response per user
    const uniqueResponses = responses.reduce((acc: any[], response: any) => {
      const existing = acc.find(r => r.is_creator === response.is_creator)
      if (!existing || new Date(response.created_at) > new Date(existing.created_at)) {
        if (existing) {
          acc = acc.filter(r => r.id !== existing.id)
        }
        acc.push(response)
      }
      return acc
    }, [])

    const creator = uniqueResponses.find(r => r.is_creator)
    const partner = uniqueResponses.find(r => !r.is_creator)

    if (!creator || !partner) {
      return NextResponse.json({ error: "Missing creator or partner response" }, { status: 400 })
    }

    // Generate advice for both (in parallel)
    let creatorAdvice, partnerAdvice
    try {
      [creatorAdvice, partnerAdvice] = await Promise.all([
        generateAdvice(sessionData.creator_name, creator, sessionData.partner_name, partner),
        generateAdvice(sessionData.partner_name, partner, sessionData.creator_name, creator)
      ])
    } catch (error: any) {
      const errorMessage = error.message || "Failed to generate advice"
      return NextResponse.json({ 
        error: errorMessage,
        code: errorMessage.includes("QUOTA_EXCEEDED") ? "QUOTA_EXCEEDED" : "GENERATION_ERROR"
      }, { status: errorMessage.includes("QUOTA_EXCEEDED") ? 429 : 500 })
    }

    // Save advice and get IDs immediately (need IDs for unique URLs)
    const { data: insertedAdvice, error: insertError } = await supabase
      .from("advice")
      .insert([
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
      .select("id, is_creator, user_id")

    if (insertError) {
      return NextResponse.json({ error: "Failed to save advice" }, { status: 500 })
    }

    // Update session status
    await supabase
      .from("sessions")
      .update({ status: "analyzed" })
      .eq("id", sessionId)

    // Return advice with unique IDs for each user
    const creatorAdviceId = insertedAdvice?.find(a => a.is_creator)?.id
    const partnerAdviceId = insertedAdvice?.find(a => !a.is_creator)?.id

    return NextResponse.json({ 
      success: true,
      adviceIds: {
        creator: creatorAdviceId,
        partner: partnerAdviceId
      }
    })

  } catch (error: any) {
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
  partnerResponse: any,
  retryCount = 0
): Promise<any> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set")
  }

  // Sanitize all user inputs to prevent prompt injection
  const sanitizedTheirSituation = sanitizeText(theirResponse.situation_description, 2000)
  const sanitizedTheirFeelings = sanitizeText(theirResponse.feelings, 1000)
  
  const sanitizedPartnerSituation = sanitizeText(partnerResponse.situation_description, 2000)
  const sanitizedPartnerFeelings = sanitizeText(partnerResponse.feelings, 1000)
  
  // Sanitize names
  const safeName = sanitizeText(theirName, 50)
  const safePartnerName = sanitizeText(partnerName, 50)

  const prompt = `You are a compassionate relationship counselor. Two partners shared their perspectives:

${safeName}'s situation: ${sanitizedTheirSituation}
${safeName}'s feelings: ${sanitizedTheirFeelings}

${safePartnerName}'s situation: ${sanitizedPartnerSituation}
${safePartnerName}'s feelings: ${sanitizedPartnerFeelings}

Provide concise, empathetic advice for ${safeName}. Keep it brief and actionable (max 150 words for advice). Use simple human language.

IMPORTANT: Return ONLY valid JSON, no explanations, no markdown, no code blocks. Just the raw JSON object:
{"advice": "1-2 short paragraphs of advice", "actionSteps": ["step1", "step2", "step3"], "conversationStarters": ["starter1", "starter2", "starter3"]}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`
    ,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              advice: {
                type: "string",
                description: "1-2 short paragraphs of empathetic advice (max 150 words)"
              },
              actionSteps: {
                type: "array",
                items: { type: "string" },
                description: "3 actionable steps"
              },
              conversationStarters: {
                type: "array",
                items: { type: "string" },
                description: "3 conversation starter phrases"
              }
            },
            required: ["advice", "actionSteps", "conversationStarters"]
          }
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    let errorData
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = { error: { message: errorText } }
    }

    // Handle rate limiting (429) with retry
    if (response.status === 429 && retryCount < 2) {
      const retryInfo = errorData.error?.details?.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo")
      let delayMs = Math.pow(2, retryCount) * 1000 // Default exponential backoff
      
      if (retryInfo?.retryDelay) {
        // Parse delay like "59s" or "32.5s" or "59.844812953s"
        const delayStr = String(retryInfo.retryDelay).trim()
        // Remove 's' suffix and parse as float, then convert to milliseconds
        const delaySeconds = parseFloat(delayStr.replace(/s$/, ""))
        if (!isNaN(delaySeconds) && delaySeconds > 0) {
          delayMs = Math.ceil(delaySeconds * 1000) // Round up to avoid 0ms delays
        }
      }
      
      // Ensure minimum delay of 1 second
      if (delayMs < 1000) {
        delayMs = 1000
      }
      
      delayMs = Math.min(delayMs, 60000)
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return generateAdvice(theirName, theirResponse, partnerName, partnerResponse, retryCount + 1)
    }

    // Return user-friendly error message
    if (response.status === 429) {
      throw new Error("API_QUOTA_EXCEEDED: The AI service has reached its daily limit. Please try again tomorrow or contact support.")
    }
    
    throw new Error(`Gemini API failed: ${response.status}`)
  }

  const data = await response.json()
  
  // With responseSchema, Gemini should return structured JSON
  // Try to get it from the structured response first
  let parsed: any = null
  
  // Check if we got structured output
  const candidate = data.candidates?.[0]
  if (candidate?.content?.parts?.[0]?.text) {
    const text = candidate.content.parts[0].text
    
    try {
      parsed = JSON.parse(text.trim())
    } catch (e) {
      // Fallback: try to extract JSON from text
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch (e2) {
          // Parsing failed, will use fallback
        }
      }
    }
  }
  
  // Validate and return parsed response, or use fallback
  if (parsed && parsed.advice && Array.isArray(parsed.actionSteps) && Array.isArray(parsed.conversationStarters)) {
    return {
      advice: parsed.advice,
      actionSteps: parsed.actionSteps.length > 0 ? parsed.actionSteps : getDefaultActionSteps(),
      conversationStarters: parsed.conversationStarters.length > 0 ? parsed.conversationStarters : getDefaultConversationStarters()
    }
  }
  
  // Parsing failed - use fallback
  return getFallbackAdvice(theirName, partnerName)
}

function getFallbackAdvice(theirName: string, partnerName: string) {
  return {
    advice: `${theirName}, I understand this is challenging. Your feelings are valid. Try to communicate openly with ${partnerName} and focus on understanding each other's perspectives. Remember that both of you want to work through this together.`,
    actionSteps: getDefaultActionSteps(),
    conversationStarters: getDefaultConversationStarters()
  }
}

function getDefaultActionSteps() {
  return [
    "Take time to calm down before discussing",
    "Use 'I feel' statements instead of blame",
    "Listen to understand, not to respond"
  ]
}

function getDefaultConversationStarters() {
  return [
    "I'd like to understand your perspective better.",
    "Can we talk about how to move forward?",
    "I care about us and want to work through this."
  ]
}
