import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { title, content, category } = await req.json();

    if (!title && !content) {
      return NextResponse.json(
        { error: 'Title or content is required for SEO optimization.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a world-class Search Engine Optimization (SEO) expert and editorial assistant specializing in bilingual (Bengali and English) content for blogs.
Analyze the following blog post details and generate an optimal SEO recommendation.

Title: ${title || 'Untitled'}
Category: ${category || 'General'}
Content snippet: ${(content || '').slice(0, 3000)}

Requirements:
1. seoTitle: High-CTR, click-worthy, search-optimized title (maximum 55-60 characters, bilingual or matching the post's language).
2. seoDescription: Compelling Google meta description between 120 and 155 characters that drives clicks.
3. suggestedTags: 5 to 7 high-impact, relevant keywords/tags (in Bengali and English).
4. excerpt: A clean, 2-sentence summary (around 150-200 characters) for article previews.
5. seoScore: An integer between 70 and 98 evaluating current keyword relevance and readability.
6. tips: 2 to 3 concise, highly actionable tips to rank higher on Google search.`;

    // Using gemini-3.1-flash-lite for ultra-fast, low-latency response
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoTitle: {
              type: Type.STRING,
              description: 'Optimized SEO Title under 60 chars',
            },
            seoDescription: {
              type: Type.STRING,
              description: 'Meta description between 120 and 160 characters',
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of relevant keywords and tags',
            },
            excerpt: {
              type: Type.STRING,
              description: 'Compelling excerpt for cards',
            },
            seoScore: {
              type: Type.INTEGER,
              description: 'Readability & SEO score from 1 to 100',
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable SEO tips to improve ranking',
            },
          },
          required: [
            'seoTitle',
            'seoDescription',
            'suggestedTags',
            'excerpt',
            'seoScore',
            'tips',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response received from Gemini API');
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Gemini SEO Optimization error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate SEO suggestions.',
      },
      { status: 500 }
    );
  }
}
