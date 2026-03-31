import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { GoogleGenAI, FileState } from '@google/genai';

const AUDIO_DIR = path.resolve('public/audio');
const OUTPUT_DIR = path.resolve('generated/transcripts');
const MODEL = 'gemini-2.5-flash';
const OVERWRITE = process.argv.includes('--overwrite');

type TranscriptRecord = {
  source: string;
  transcriptPath: string;
  model: string;
  createdAt: string;
};

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY. Set it in your environment before running this script.');
  }

  const ai = new GoogleGenAI({ apiKey });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const entries = await fs.readdir(AUDIO_DIR, { withFileTypes: true });
  const audioFiles = entries
    .filter((entry) => entry.isFile() && /\.(mp3|m4a|wav|mp4|mpeg|mpga)$/i.test(entry.name))
    .map((entry) => path.join(AUDIO_DIR, entry.name));

  if (audioFiles.length === 0) {
    console.log(`No audio files found in ${AUDIO_DIR}`);
    return;
  }

  const records: TranscriptRecord[] = [];

  for (const filePath of audioFiles) {
    const baseName = path.parse(filePath).name;
    const transcriptPath = path.join(OUTPUT_DIR, `${baseName}.txt`);
    const metaPath = path.join(OUTPUT_DIR, `${baseName}.json`);

    if (!OVERWRITE) {
      try {
        await fs.access(transcriptPath);
        console.log(`Skipping ${path.basename(filePath)} because ${path.basename(transcriptPath)} already exists. Use --overwrite to regenerate.`);
        continue;
      } catch {
        // Continue to transcription.
      }
    }

    console.log(`Uploading ${path.basename(filePath)}...`);
    const uploaded = await ai.files.upload({
      file: filePath,
      config: { mimeType: 'audio/mpeg' },
    });

    await waitForActiveFile(ai, uploaded.name ?? '');

    console.log(`Transcribing ${path.basename(filePath)}...`);
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                fileUri: uploaded.uri,
                mimeType: 'audio/mpeg',
              },
            },
            {
              text:
                'Transcribe this audio verbatim. Preserve speaker turns if clear. Do not summarize, do not add commentary, and do not invent words that are not present.',
            },
          ],
        },
      ],
    });

    const transcript = normalizeTranscript(response.text ?? '');
    await fs.writeFile(transcriptPath, transcript + '\n', 'utf8');
    await fs.writeFile(
      metaPath,
      JSON.stringify(
        {
          source: path.relative(process.cwd(), filePath),
          model: MODEL,
          transcript: path.relative(process.cwd(), transcriptPath),
          createdAt: new Date().toISOString(),
          file: {
            name: uploaded.name,
            uri: uploaded.uri,
            state: uploaded.state,
          },
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );

    records.push({
      source: path.basename(filePath),
      transcriptPath: path.relative(process.cwd(), transcriptPath),
      model: MODEL,
      createdAt: new Date().toISOString(),
    });

    console.log(`Wrote ${path.relative(process.cwd(), transcriptPath)}`);
  }

  console.log('\nDone.');
  if (records.length > 0) {
    console.log('Created transcripts for:');
    for (const record of records) {
      console.log(`- ${record.source} -> ${record.transcriptPath}`);
    }
  }
}

async function waitForActiveFile(ai: GoogleGenAI, fileName: string) {
  if (!fileName) return;

  for (let attempt = 0; attempt < 60; attempt++) {
    const file = await ai.files.get({ name: fileName });
    if (file.state === FileState.ACTIVE) return;
    if (file.state === FileState.FAILED) {
      throw new Error(`Upload failed for ${fileName}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Timed out waiting for ${fileName} to become ACTIVE`);
}

function normalizeTranscript(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
