import OpenAI from "openai";
import { PostType } from "../types";
import { getDefaultTemplate } from "../db/templates";
import { getSetting } from "../db/settings";

export interface GeneratedPost {
  title: string;
  hook: string;
  body: string;
  callToAction: string;
  hashtags: string[];
  fullPost: string;
}

export interface GeneratedCarousel {
  title: string;
  slides: { slideNumber: number; headline: string; bodyText: string; visualSuggestion: string }[];
  closingSlide: { headline: string; callToAction: string };
  captionText: string;
  hashtags: string[];
}

async function buildPrompt(topic: string, postType: PostType, additionalContext?: string) {
  const [template, brandNameSetting, brandVoiceSetting] = await Promise.all([
    getDefaultTemplate(postType),
    getSetting("brand_name"),
    getSetting("brand_voice"),
  ]);

  const brandName = brandNameSetting || "POZ";
  const brandVoice = brandVoiceSetting || "";

  let systemPrompt = template?.system_prompt || getDefaultSystemPrompt(postType);
  if (brandVoice) {
    systemPrompt = `Brand: ${brandName}\nBrand Voice: ${brandVoice}\n\n${systemPrompt}`;
  }

  let userPrompt = `Write a LinkedIn post about: ${topic}`;
  if (additionalContext) {
    userPrompt += `\n\nAdditional context: ${additionalContext}`;
  }

  return { systemPrompt, userPrompt };
}

function getDefaultSystemPrompt(postType: PostType): string {
  const base = `You are a LinkedIn content strategist. Write engaging professional posts.
Keep paragraphs to 1-2 lines. Use line breaks for readability.
Start with a bold hook. Write conversationally. Use emojis sparingly (1-3 max).
End with a call-to-action or question. Target 150-300 words.`;

  const typeInstructions: Record<PostType, string> = {
    problem_solution: "Write a Problem-Solution post: Name a problem, agitate it, present a solution, close with a takeaway.",
    educational: "Write an Educational post: Start with a surprising insight, teach a concept, use lists, provide actionable takeaways.",
    execution: "Write a Build-in-Public post: Share what you're working on, a challenge faced, concrete details, and a lesson learned.",
    carousel: "Write a Carousel post: Create slide-by-slide content with headlines and body text for each slide.",
  };

  return `${base}\n\n${typeInstructions[postType]}`;
}

export async function generatePost(params: {
  topic: string;
  postType: PostType;
  additionalContext?: string;
}): Promise<GeneratedPost | GeneratedCarousel> {
  const apiKey = process.env.OPENAI_API_KEY || (await getSetting("openai_api_key"));
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const model = (await getSetting("default_model")) || "gpt-4o";
  const openai = new OpenAI({ apiKey });
  const { systemPrompt, userPrompt } = await buildPrompt(params.topic, params.postType, params.additionalContext);

  if (params.postType === "carousel") {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt + "\n\nRespond with a JSON object containing: title, slides (array of {slideNumber, headline, bodyText, visualSuggestion}), closingSlide ({headline, callToAction}), captionText, hashtags (array of strings)." },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}") as GeneratedCarousel;
  }

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt + "\n\nRespond with a JSON object containing: title (short internal label), hook (first 2 lines), body (main content), callToAction (closing CTA), hashtags (array of strings), fullPost (complete assembled post)." },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || "{}") as GeneratedPost;
}
