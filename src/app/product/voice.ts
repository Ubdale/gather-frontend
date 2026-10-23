import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  ElementRef,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

export interface VoiceDraft {
  audio: string;
  mime: string;
  duration: number;
  waveform: number[];
}
const styles = `
:host{display:block;min-width:0}.voice{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #cfdfd8;border-radius:18px;background:#f2f8f5;color:#225d4d;flex-wrap:wrap}.voice button{border:0;border-radius:50%;width:36px;height:36px;background:#fff;color:inherit;cursor:pointer;font-size:18px;flex-shrink:0}.voice button:disabled{opacity:.45;cursor:default}.voice button:focus-visible,.voice input:focus-visible{outline:3px solid #307b65;outline-offset:3px}.bars{height:32px;display:flex;align-items:center;gap:3px;flex:1;min-width:90px}.bars i{display:block;flex:1;max-width:5px;min-width:2px;background:#70a693;border-radius:3px}.time{font-size:12px;font-variant-numeric:tabular-nums}.recording{color:#b32d44}.note{font:12px/1.5 system-ui;margin:6px 4px;color:#62756b}.error{color:#a22c3d}.primary{background:#246f59!important;color:white!important}.seek{width:100%;accent-color:#246f59;height:12px}.player{max-width:340px}.player .bars i.played{background:#225d4d}.label{font:12px system-ui}.voice audio{display:none}@media(max-width:480px){.voice{gap:8px;padding:10px}.bars{gap:2px;min-width:60px}}
`;

@Component({
  selector: 'gather-voice-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [styles],
  template: ` <div class="voice player">
      <audio
        #audio
        [src]="src"
        preload="none"
        (timeupdate)="position = audio.currentTime"
        (ended)="playing = false; position = 0"
        (pause)="playing = false"
        (error)="error = 'Audio could not load. Try again.'"
      ></audio>
      <button
        type="button"
        (click)="toggle(audio)"
        [attr.aria-label]="
          playing ? 'Pause voice message' : 'Play voice message'
        "
      >
        {{ playing ? 'Ⅱ' : '▶' }}
      </button>
      <div class="bars" aria-hidden="true">
        @for (bar of waveform; track $index) {
          <i
            [class.played]="$index / waveform.length < position / duration"
            [style.height.px]="4 + bar * 26"
          ></i>
        }
      </div>
      <span class="time">{{ clock(position || duration) }}</span>
      <button
        type="button"
        class="label"
        (click)="
          speed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
          audio.playbackRate = speed
        "
        aria-label="Change playback speed"
      >
        {{ speed }}×
      </button>
      <input
        class="seek"
        type="range"
        aria-label="Seek voice message"
        min="0"
        [max]="duration"
        step="0.1"
        [value]="position"
        (input)="seek(audio, $event)"
      />
    </div>
    @if (error) {
      <p class="note error" role="alert">{{ error }}</p>
    }`,
})
export class VoicePlayerComponent implements OnDestroy {
  @ViewChild('audio') audio?: ElementRef<HTMLAudioElement>;
  @Input({ required: true }) src = '';
  @Input() duration = 0;
  @Input() waveform: number[] = Array(40).fill(0.2);
  position = 0;
  playing = false;
  speed = 1;
  error = '';
  clock(value: number) {
    return (
      Math.floor(value / 60) +
      ':' +
      Math.floor(value % 60)
        .toString()
        .padStart(2, '0')
    );
  }
  async toggle(audio: HTMLAudioElement) {
    this.error = '';
    if (this.playing) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
      this.playing = true;
    } catch {
      this.error = 'Playback is unavailable. Try again.';
    }
  }
  seek(audio: HTMLAudioElement, event: Event) {
    try {
      audio.currentTime = Number((event.target as HTMLInputElement).value);
      this.position = audio.currentTime;
    } catch {
      this.error = 'Start playback before seeking.';
    }
  }
  ngOnDestroy() {
    const audio = this.audio?.nativeElement;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
  }
}

@Component({
  selector: 'gather-voice-recorder',
  standalone: true,
  imports: [VoicePlayerComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [styles],
  template: ` @if (state === 'idle') {
      <button
        class="button secondary"
        type="button"
        (click)="start()"
        [disabled]="disabled || requesting"
        aria-label="Record a voice message"
      >
        <span class="material-symbols-outlined">mic</span
        >{{ requesting ? 'Opening microphone…' : 'Voice message' }}
      </button>
    } @else {
      <div class="voice" aria-label="Voice recorder">
        <button
          type="button"
          (click)="reset()"
          [disabled]="disabled"
          aria-label="Discard recording"
        >
          ×
        </button>
        @if (state === 'recording' || state === 'paused') {
          <span class="recording" aria-hidden="true">●</span
          ><span class="time" role="timer">{{ clock(elapsed) }}</span>
          <div class="bars" aria-hidden="true">
            @for (bar of bars; track $index) {
              <i [style.height.px]="4 + bar * 26"></i>
            }
          </div>
          <button
            type="button"
            (click)="pause()"
            [attr.aria-label]="
              state === 'paused' ? 'Resume recording' : 'Pause recording'
            "
          >
            {{ state === 'paused' ? '▶' : 'Ⅱ' }}
          </button>
          <button
            type="button"
            class="primary"
            (click)="stop()"
            aria-label="Finish recording and preview"
          >
            ■
          </button>
        } @else if (state === 'preview') {
          <span class="label">Ready to send · {{ clock(elapsed) }}</span>
          <button
            type="button"
            class="primary"
            (click)="send()"
            [disabled]="disabled"
            aria-label="Send voice message"
          >
            ↑
          </button>
        } @else {
          <span class="label">Preparing recording…</span>
        }
      </div>
      @if (state === 'preview' && url) {
        <gather-voice-player
          [src]="url"
          [duration]="elapsed"
          [waveform]="peaks"
        />
      }
      <p class="note" aria-live="polite">
        {{
          state === 'paused'
            ? 'Recording paused.'
            : state === 'preview'
              ? 'Listen before sending, or discard and record again.'
              : 'Recording · maximum 3 minutes / 2 MB.'
        }}
      </p>
    }
    @if (error) {
      <p class="note error" role="alert">{{ error }}</p>
    }`,
})
export class VoiceRecorderComponent implements OnDestroy {
  @Input() disabled = false;
  @Output() recorded = new EventEmitter<VoiceDraft>();
  state: 'idle' | 'recording' | 'paused' | 'preparing' | 'preview' = 'idle';
  requesting = false;
  error = '';
  elapsed = 0;
  url = '';
  bars = Array(40).fill(0.05);
  peaks: number[] = [];
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private context?: AudioContext;
  private timer?: ReturnType<typeof setInterval>;
  private chunks: Blob[] = [];
  private blob?: Blob;
  private samples: number[] = [];
  private bytes = 0;
  private generation = 0;
  clock(value: number) {
    return (
      Math.floor(value / 60) +
      ':' +
      Math.floor(value % 60)
        .toString()
        .padStart(2, '0')
    );
  }
  async start() {
    if (this.disabled || this.requesting || this.state !== 'idle') return;
    this.error = '';
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      this.error =
        'Voice recording needs a supported browser and HTTPS (or localhost).';
      return;
    }
    this.requesting = true;
    const generation = ++this.generation;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      const mime = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mime)
        throw new Error(
          'This browser cannot create a supported voice recording.',
        );
      const recorder = (this.recorder = new MediaRecorder(stream, {
        mimeType: mime,
        audioBitsPerSecond: 48000,
      }));
      this.chunks = [];
      this.samples = [];
      this.elapsed = 0;
      this.bytes = 0;
      recorder.ondataavailable = (event) => {
        if (generation !== this.generation) return;
        if (event.data.size) {
          this.chunks.push(event.data);
          this.bytes += event.data.size;
          if (this.bytes > 2 * 1024 * 1024) {
            this.reset();
            this.error =
              'The recording exceeded 2 MB. Please record a shorter message.';
          }
        }
      };
      recorder.onerror = () => {
        this.reset();
        this.error = 'Recording failed. Please try again.';
      };
      recorder.onstop = () => {
        if (generation !== this.generation) return;
        this.release();
        this.blob = new Blob(this.chunks, { type: mime.split(';')[0] });
        if (this.blob.size === 0 || this.elapsed < 0.1) {
          this.reset();
          this.error = 'Record a little longer before sending.';
          return;
        }
        this.url = URL.createObjectURL(this.blob);
        this.peaks = Array.from({ length: 40 }, (_, i) => {
          const a = Math.floor((i * this.samples.length) / 40),
            b = Math.max(
              a + 1,
              Math.floor(((i + 1) * this.samples.length) / 40),
            );
          return Math.max(0.05, ...this.samples.slice(a, b));
        });
        this.state = 'preview';
      };
      // Keep recording functional even when a browser cannot provide waveform analysis.
      let analyser: AnalyserNode | undefined;
      try {
        this.context = new AudioContext();
        await this.context.resume();
        analyser = this.context.createAnalyser();
        analyser.fftSize = 256;
        this.context.createMediaStreamSource(stream).connect(analyser);
      } catch {
        void this.context?.close();
        this.context = undefined;
      }
      if (generation !== this.generation) return;
      recorder.start(250);
      this.state = 'recording';
      let last = performance.now();
      this.timer = setInterval(() => {
        const now = performance.now();
        if (this.state === 'recording') {
          this.elapsed += (now - last) / 1000;
          const data = new Uint8Array(128);
          analyser?.getByteTimeDomainData(data);
          const level = analyser
            ? Math.min(
                1,
                Math.sqrt(
                  data.reduce((sum, v) => sum + (v - 128) ** 2, 0) /
                    data.length,
                ) / 45,
              )
            : 0.1;
          this.samples.push(level);
          this.bars = [...this.bars.slice(1), level];
          if (this.elapsed >= 180) {
            this.elapsed = 180;
            this.stop();
          }
        }
        last = now;
      }, 100);
    } catch (error) {
      this.reset();
      this.error =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow it in browser settings and try again.'
          : error instanceof Error
            ? error.message
            : 'The microphone is unavailable.';
    } finally {
      this.requesting = false;
    }
  }
  pause() {
    if (this.state === 'recording') {
      this.recorder?.pause();
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.recorder?.resume();
      this.state = 'recording';
    }
  }
  stop() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.state = 'preparing';
      if (this.timer) clearInterval(this.timer);
      this.recorder.stop();
    }
  }
  async send() {
    if (!this.blob || this.disabled || this.state !== 'preview') return;
    const generation = this.generation;
    const blob = this.blob;
    const reader = new FileReader();
    reader.onerror = () =>
      (this.error = 'Could not prepare recording. Please try again.');
    reader.onload = () => {
      if (generation === this.generation)
        this.recorded.emit({
          audio: String(reader.result).split(',')[1],
          mime: blob.type,
          duration: this.elapsed,
          waveform: this.peaks,
        });
    };
    reader.readAsDataURL(blob);
  }
  private release() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    void this.context?.close();
    this.context = undefined;
  }
  reset() {
    this.generation++;
    if (this.recorder && this.recorder.state !== 'inactive')
      this.recorder.stop();
    this.recorder = undefined;
    this.release();
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = '';
    this.blob = undefined;
    this.chunks = [];
    this.samples = [];
    this.bars = Array(40).fill(0.05);
    this.state = 'idle';
    this.elapsed = 0;
    this.requesting = false;
    this.error = '';
  }
  ngOnDestroy() {
    this.reset();
  }
}
