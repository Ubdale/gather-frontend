import { VoiceRecorderComponent } from './voice';

describe('Voice recorder lifecycle', () => {
  let component: VoiceRecorderComponent;
  beforeEach(() => (component = new VoiceRecorderComponent()));
  afterEach(() => component.ngOnDestroy());
  it('releases a microphone granted after the recorder was destroyed', async () => {
    let grant!: (stream: MediaStream) => void;
    const stop = jasmine.createSpy('stop');
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
      new Promise((resolve) => (grant = resolve)),
    );
    const starting = component.start();
    component.ngOnDestroy();
    grant({ getTracks: () => [{ stop }] } as unknown as MediaStream);
    await starting;
    expect(stop).toHaveBeenCalled();
    expect(component.state).toBe('idle');
  });
  it('explains permission denial without retaining an active recording', async () => {
    spyOn(navigator.mediaDevices, 'getUserMedia').and.rejectWith(
      new DOMException('Denied', 'NotAllowedError'),
    );
    await component.start();
    expect(component.error).toContain('denied');
    expect(component.state).toBe('idle');
    expect(component.requesting).toBeFalse();
  });
  it('does not request a microphone when disabled', async () => {
    const request = spyOn(navigator.mediaDevices, 'getUserMedia');
    component.disabled = true;
    await component.start();
    expect(request).not.toHaveBeenCalled();
  });
  it('supports pause, preview, send and cleanup without using a real microphone', async () => {
    const stopTrack = jasmine.createSpy('stopTrack');
    spyOn(navigator.mediaDevices, 'getUserMedia').and.resolveTo({
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream);
    const recorder: any = {
      state: 'inactive',
      ondataavailable: null,
      onstop: null,
      start() {
        this.state = 'recording';
      },
      pause() {
        this.state = 'paused';
      },
      resume() {
        this.state = 'recording';
      },
      stop() {
        this.state = 'inactive';
        this.ondataavailable({
          data: new Blob(['test recording'], { type: 'audio/webm' }),
        });
        this.onstop();
      },
    };
    const create = spyOn(window, 'MediaRecorder').and.returnValue(recorder);
    (create as any).isTypeSupported = () => true;
    spyOn(window, 'AudioContext').and.throwError('No analyser in this test');
    const revoke = spyOn(URL, 'revokeObjectURL');
    await component.start();
    expect(component.state).toBe('recording');
    component.pause();
    expect(component.state).toBe('paused');
    component.pause();
    expect(component.state).toBe('recording');
    component.elapsed = 2;
    component.stop();
    expect(component.state).toBe('preview');
    expect(stopTrack).toHaveBeenCalled();
    const draft = await new Promise<any>((resolve) => {
      component.recorded.subscribe(resolve);
      void component.send();
    });
    expect(draft.audio).toBe(btoa('test recording'));
    expect(draft.duration).toBe(2);
    component.reset();
    expect(revoke).toHaveBeenCalled();
    expect(component.state).toBe('idle');
  });
});
