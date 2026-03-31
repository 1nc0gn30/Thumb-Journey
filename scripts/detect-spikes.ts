import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const AUDIO_DIR = path.resolve('public/audio');
const OUTPUT_DIR = path.resolve('generated/segments');
const SAMPLE_RATE = 16000;
const WINDOW_MS = 50;
const HOP_MS = 25;
const SILENCE_RMS_THRESHOLD = 0.015;
const SPIKE_Z_THRESHOLD = 1.4;

type Segment = {
  start: number;
  end: number;
  kind: 'spike' | 'pause';
  score: number;
};

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const entries = await fs.readdir(AUDIO_DIR, { withFileTypes: true });
  const audioFiles = entries
    .filter((entry) => entry.isFile() && /\.(mp3|m4a|wav|mp4|mpeg|mpga)$/i.test(entry.name))
    .map((entry) => path.join(AUDIO_DIR, entry.name));

  if (!audioFiles.length) {
    console.log(`No audio files found in ${AUDIO_DIR}`);
    return;
  }

  for (const filePath of audioFiles) {
    const baseName = path.parse(filePath).name;
    console.log(`Analyzing ${path.basename(filePath)}...`);
    const pcm = await decodeToPcm16(filePath);
    const envelope = computeEnvelope(pcm);
    const stats = summarize(envelope.map((frame) => frame.rms));
    const spikes = findSpikes(envelope, stats);
    const pauses = findPauses(envelope);
    const payload = {
      source: path.relative(process.cwd(), filePath),
      sampleRate: SAMPLE_RATE,
      windowMs: WINDOW_MS,
      hopMs: HOP_MS,
      stats,
      spikes,
      pauses,
      frames: envelope.length,
    };
    const outPath = path.join(OUTPUT_DIR, `${baseName}.json`);
    await fs.writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
  }
}

async function decodeToPcm16(filePath: string) {
  const args = [
    '-hide_banner',
    '-loglevel', 'error',
    '-i', filePath,
    '-ac', '1',
    '-ar', String(SAMPLE_RATE),
    '-f', 's16le',
    'pipe:1',
  ];

  const buffer = await runCommand('ffmpeg', args);
  const samples = new Int16Array(buffer.buffer, buffer.byteOffset, Math.floor(buffer.byteLength / 2));
  return new Int16Array(samples);
}

function computeEnvelope(samples: Int16Array) {
  const windowSize = Math.max(1, Math.floor((SAMPLE_RATE * WINDOW_MS) / 1000));
  const hopSize = Math.max(1, Math.floor((SAMPLE_RATE * HOP_MS) / 1000));
  const frames: Array<{ time: number; rms: number }> = [];

  for (let start = 0; start + windowSize <= samples.length; start += hopSize) {
    let sum = 0;
    for (let i = start; i < start + windowSize; i++) {
      const value = samples[i] / 32768;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / windowSize);
    frames.push({ time: start / SAMPLE_RATE, rms });
  }

  return frames;
}

function summarize(values: number[]) {
  if (!values.length) {
    return { mean: 0, stdev: 0, max: 0, min: 0 };
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);
  return {
    mean,
    stdev,
    max: Math.max(...values),
    min: Math.min(...values),
  };
}

function findSpikes(frames: Array<{ time: number; rms: number }>, stats: { mean: number; stdev: number }) {
  const spikes: Segment[] = [];
  const threshold = stats.mean + stats.stdev * SPIKE_Z_THRESHOLD;

  for (let i = 1; i < frames.length - 1; i++) {
    const prev = frames[i - 1];
    const current = frames[i];
    const next = frames[i + 1];
    const isLocalMax = current.rms >= prev.rms && current.rms >= next.rms;
    if (isLocalMax && current.rms >= threshold) {
      spikes.push({
        start: current.time,
        end: current.time + WINDOW_MS / 1000,
        kind: 'spike',
        score: clamp01((current.rms - stats.mean) / (stats.stdev || 1e-6)),
      });
    }
  }

  return mergeSegments(spikes);
}

function findPauses(frames: Array<{ time: number; rms: number }>) {
  const pauses: Segment[] = [];
  let runStart: number | null = null;
  let runScore = 0;

  for (const frame of frames) {
    if (frame.rms <= SILENCE_RMS_THRESHOLD) {
      runStart ??= frame.time;
      runScore += 1;
    } else if (runStart !== null) {
      const duration = frame.time - runStart;
      if (duration >= 0.2) {
        pauses.push({
          start: runStart,
          end: frame.time,
          kind: 'pause',
          score: clamp01(duration / 1.2),
        });
      }
      runStart = null;
      runScore = 0;
    }
  }

  return mergeSegments(pauses);
}

function mergeSegments(segments: Segment[]) {
  if (!segments.length) return segments;
  const merged: Segment[] = [segments[0]];
  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1];
    const current = segments[i];
    if (current.kind === prev.kind && current.start <= prev.end + 0.08) {
      prev.end = Math.max(prev.end, current.end);
      prev.score = Math.max(prev.score, current.score);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function runCommand(cmd: string, args: string[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`${cmd} exited with ${code}: ${Buffer.concat(stderr).toString('utf8')}`));
      }
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
