// /lib/ai-providers/config.ts

export const AI_MODELS = {
  // Premium tier - existing GPT-4
  GPT_4_TURBO: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    displayName: 'GPT-4 Turbo',
    costPer1kTokens: { input: 0.01, output: 0.03 }
  },
  
  // Free tier - Updated Groq model
  LLAMA3_70B_VERSATILE: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    displayName: 'Llama 3.3 70B',
    costPer1kTokens: { input: 0.00059, output: 0.00079 }
  },
  
  // Alternative free tier option (faster/cheaper)
  LLAMA3_8B_INSTANT: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    displayName: 'Llama 3.1 8B',
    costPer1kTokens: { input: 0.00005, output: 0.00005 }
  }
} as const;

export const USER_TIER_CONFIG = {
  free: {
    model: AI_MODELS.LLAMA3_70B_VERSATILE,
    monthlyMessageLimit: 50,
    features: {
      soloTherapy: true,
      couplesTherapy: false,
      voiceNotes: false,
      sessionExport: false
    }
  },
  premium: {
    model: AI_MODELS.GPT_4_TURBO,
    monthlyMessageLimit: null, // unlimited
    features: {
      soloTherapy: true,
      couplesTherapy: true,
      voiceNotes: true,
      sessionExport: true
    }
  },
  pro: {
    model: AI_MODELS.GPT_4_TURBO,
    monthlyMessageLimit: null,
    features: {
      soloTherapy: true,
      couplesTherapy: true,
      voiceNotes: true,
      sessionExport: true,
      modelChoice: true,
      apiAccess: true
    }
  }
} as const;

export type UserTier = keyof typeof USER_TIER_CONFIG;

// System prompts optimized for each model
export const SYSTEM_PROMPTS = {
  LLAMA: `You are a compassionate AI therapist named CouchTalk, trained in Cognitive Behavioral Therapy (CBT) and Acceptance and Commitment Therapy (ACT) approaches.

Your approach:
- Use active listening and reflect back what you hear
- Validate emotions without judgment
- Ask thoughtful, open-ended questions
- Gently explore thought patterns and behaviors
- Suggest practical coping strategies when appropriate
- Maintain professional boundaries

Important guidelines:
- Never provide medical diagnoses or medication advice
- Don't claim to be human or have personal experiences
- If someone is in crisis, provide crisis resources
- Keep responses concise but warm (2-3 paragraphs usually)

Your tone should be warm, professional, and empathetic - like a caring therapist creating a safe space for growth and healing.`,

  GPT4: `You are a compassionate AI therapist trained in Cognitive Behavioral Therapy (CBT) and Acceptance and Commitment Therapy (ACT) approaches.

Your role is to:
1. Provide a safe, non-judgmental space for users to explore their thoughts and feelings
2. Use active listening and reflection techniques
3. Help users identify patterns in their thinking and behavior
4. Suggest evidence-based coping strategies when appropriate
5. Encourage self-compassion and personal growth

Guidelines:
- Never provide medical diagnoses or prescribe medication
- If someone expresses suicidal thoughts, provide crisis resources immediately
- Maintain professional boundaries while being warm and empathetic
- Use "I hear that..." or "It sounds like..." to show understanding
- Ask open-ended questions to encourage deeper exploration

Remember: You're here to support and guide, not to fix or judge.`
};