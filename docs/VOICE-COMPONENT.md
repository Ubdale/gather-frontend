# Gather Voice

The custom recorder is restored in `src/app/product/voice.ts`, with the original live-waveform, timer, pause/resume, discard and preview interaction. It is now isolated from workspace and chat state.

`VoiceRecorderComponent` accepts `disabled` and emits `recorded: VoiceDraft` (base64 audio, MIME type, duration in seconds and up to 64 normalized waveform peaks). Call `reset()` after successful upload; failures leave the preview available for retry. It releases microphone tracks, timers, AudioContext and object URLs on discard or destruction. Switching conversations discards the previous draft. The microphone starts only after the user clicks Record and grants permission.

`VoicePlayerComponent` accepts an authenticated same-origin `src`, `duration`, and normalized `waveform`. It supplies play/pause, a keyboard-operable seek slider and 1×/1.5×/2× speed. No runtime dependencies beyond Angular; forms/router and the Gather API are not dependencies of either component.

Recording requires HTTPS or localhost. Runtime MIME negotiation selects WebM/Opus, Ogg/Opus or MP4. Cross-browser encoding and decoding differ: validate on target Safari/iOS, Firefox and Chromium versions before marketing broad compatibility. This change has not been certified on physical mobile devices. Server format validation checks container signatures, not a complete decoder; duration and waveform are client metadata. Limits: 180 seconds in the recorder, 2 MB enforced by the server, and workspace quotas of 50/256/1024 MB. The server rejects suspended participants and nonparticipants, supports byte-range playback, and stores audio in PostgreSQL BYTEA columns so normal database backups include it. API messages expose metadata only; the authenticated audio route returns bytes.

## Commercial direction

Sell Gather as a private community service for clubs, creator groups and customer communities; voice messages make conversations more personal. A second product can be a reusable Angular recorder/player package for chat, helpdesk and learning applications. npm is a distribution channel; developers and software companies are the prospective customers.

Before offering the component independently: confirm ownership of the original code and all assets; extract a versioned package with public exports, theme tokens and an accessible demo; document browser compatibility, microphone failures and events; run keyboard/screen-reader and physical-device tests; provide a license and support policy. Keep the recorder transport-independent and let customers supply their own storage. Treat developer/team license pricing as an experiment, not established demand. Do not advertise exclusive technology: other Angular voice recorders already exist. No package, paid listing or license sale has been published by this change.
