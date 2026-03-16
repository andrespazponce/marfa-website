import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { secret, tags } = await req.json();

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const tagList = Array.isArray(tags) ? tags : [tags];
  for (const tag of tagList) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true, tags });
}
