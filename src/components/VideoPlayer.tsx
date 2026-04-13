import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface Subtitle {
  url: string;
  format?: string;
  subtitleLanguage?: string;
}

interface VideoPlayerProps {
  src: string;
  subtitles?: Subtitle[];
  onEnded?: () => void;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrevEpisode?: boolean;
  hasNextEpisode?: boolean;
  onToggleList?: () => void;
}

const LANG_LABELS: Record<string, string> = {
  vi_VN: 'Tiếng Việt',
  en_US: 'English',
  zh_CN: '中文',
  zh_TW: '中文(繁)',
  ja_JP: '日本語',
  ko_KR: '한국어',
  th_TH: 'ไทย',
  es_ES: 'Español',
  pt_PT: 'Português',
  fr_FR: 'Français',
  de_DE: 'Deutsch',
  id_ID: 'Bahasa Indonesia',
  ms_MY: 'Bahasa Melayu',
  ar_AE: 'العربية',
  tr_TR: 'Türkçe',
  it_IT: 'Italiano',
  hi_IN: 'हिन्दी',
};

function langCode(locale?: string): string {
  if (!locale) return 'vi';
  return locale.split('_')[0];
}

// SVG icons for injected buttons
const SVG_PREV = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20"/></svg>`
const SVG_NEXT = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20"/></svg>`
const SVG_LIST = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`
const SVG_SUB = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4M13 15h4M7 11h2M12 11h5"/></svg>`

const PLYR_THEME: React.CSSProperties = {
  '--plyr-color-main': '#38bdf8',
  '--plyr-video-background': '#000',
  '--plyr-video-controls-background':
    'linear-gradient(transparent, rgba(0,0,0,0.75))',
  '--plyr-video-control-color': 'rgba(255,255,255,0.85)',
  '--plyr-video-control-color-hover': '#fff',
  '--plyr-video-control-background-hover': 'rgba(255,255,255,0.12)',
  '--plyr-video-progress-buffered-background': 'rgba(255,255,255,0.2)',
  '--plyr-video-range-track-background': 'rgba(255,255,255,0.25)',
  '--plyr-range-fill-background': '#38bdf8',
  '--plyr-range-thumb-background': '#fff',
  '--plyr-range-thumb-height': '13px',
  '--plyr-range-track-height': '3px',
  '--plyr-range-thumb-shadow': '0 1px 4px rgba(0,0,0,0.5)',
  '--plyr-menu-background': 'rgba(18,18,18,0.98)',
  '--plyr-menu-color': 'rgba(255,255,255,0.85)',
  '--plyr-menu-shadow': '0 4px 16px rgba(0,0,0,0.7)',
  '--plyr-menu-back-border-color': 'rgba(255,255,255,0.1)',
  '--plyr-tooltip-background': 'rgba(18,18,18,0.95)',
  '--plyr-tooltip-color': '#fff',
  '--plyr-tooltip-shadow': '0 2px 8px rgba(0,0,0,0.6)',
  '--plyr-control-spacing': '10px',
  '--plyr-control-icon-size': '18px',
  '--plyr-control-radius': '4px',
  '--plyr-focus-visible-color': '#38bdf8',
  '--plyr-font-family':
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--plyr-font-size-base': '14px',
} as React.CSSProperties;

function makeBtn(svg: string, label: string, disabled = false): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'plyr__control';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = svg;
  if (disabled) {
    btn.disabled = true;
    btn.style.opacity = '0.3';
    btn.style.cursor = 'default';
  }
  return btn;
}

function PlyrPlayer({
  src,
  subtitles,
  onEnded,
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode,
  hasNextEpisode,
  onToggleList,
}: {
  src: string;
  subtitles: Subtitle[];
  onEnded?: () => void;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrevEpisode?: boolean;
  hasNextEpisode?: boolean;
  onToggleList?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep callbacks in refs so injected DOM listeners always call latest version
  const onPrevRef = useRef(onPrevEpisode);
  const onNextRef = useRef(onNextEpisode);
  const onListRef = useRef(onToggleList);
  useEffect(() => { onPrevRef.current = onPrevEpisode; }, [onPrevEpisode]);
  useEffect(() => { onNextRef.current = onNextEpisode; }, [onNextEpisode]);
  useEffect(() => { onListRef.current = onToggleList; }, [onToggleList]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.style.width = '100%';

    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = sub.url;
      track.srclang = langCode(sub.subtitleLanguage);
      track.label =
        LANG_LABELS[sub.subtitleLanguage || ''] ||
        sub.subtitleLanguage ||
        'Subtitles';
      if (i === 0) track.default = true;
      video.appendChild(track);
    }

    container.appendChild(video);
    if (onEnded) video.addEventListener('ended', onEnded);

    const player = new Plyr(video, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'settings',
        'fullscreen',
      ],
      settings: ['speed'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      captions: { active: subtitles.length > 0, update: true, language: 'vi' },
      hideControls: true,
      clickToPlay: true,
      disableContextMenu: true,
      resetOnEnd: false,
      ratio: '16:9',
    });

    // Inject custom buttons into the plyr control bar after ready
    player.on('ready', () => {
      const controls = container.querySelector('.plyr__controls');
      if (!controls) return;

      // Find the fullscreen button to insert before it
      const fsBtn = controls.querySelector('[data-plyr="fullscreen"]');

      // Subtitle toggle button — only when subtitles exist
      if (subtitles.length > 0) {
        let subsOn = true;
        const subBtn = makeBtn(SVG_SUB, 'Phụ đề');
        subBtn.style.color = '#38bdf8'; // active = highlighted
        subBtn.addEventListener('click', () => {
          subsOn = !subsOn;
          player.currentTrack = subsOn ? 0 : -1;
          subBtn.style.color = subsOn ? '#38bdf8' : 'rgba(255,255,255,0.5)';
          subBtn.setAttribute('aria-label', subsOn ? 'Tắt phụ đề' : 'Bật phụ đề');
        });
        controls.insertBefore(subBtn, fsBtn ?? null);
      }

      // List toggle button
      if (onListRef.current) {
        const listBtn = makeBtn(SVG_LIST, 'Danh sách tập');
        listBtn.addEventListener('click', () => onListRef.current?.());
        controls.insertBefore(listBtn, fsBtn ?? null);
      }

      // Next episode button
      const nextBtn = makeBtn(SVG_NEXT, 'Tập sau', !hasNextEpisode);
      nextBtn.addEventListener('click', () => onNextRef.current?.());
      controls.insertBefore(nextBtn, fsBtn ?? null);

      // Prev episode button (insert before next so order is: prev next list fs)
      const prevBtn = makeBtn(SVG_PREV, 'Tập trước', !hasPrevEpisode);
      prevBtn.addEventListener('click', () => onPrevRef.current?.());
      controls.insertBefore(prevBtn, nextBtn);
    });

    return () => {
      if (onEnded) video.removeEventListener('ended', onEnded);
      player.destroy();
      container.innerHTML = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return <div ref={containerRef} />;
}

export default function VideoPlayer({
  src,
  subtitles = [],
  onEnded,
  onPrevEpisode,
  onNextEpisode,
  hasPrevEpisode,
  hasNextEpisode,
  onToggleList,
}: VideoPlayerProps) {
  return (
    <div style={PLYR_THEME} className="w-full bg-black">
      <PlyrPlayer
        src={src}
        subtitles={subtitles}
        onEnded={onEnded}
        onPrevEpisode={onPrevEpisode}
        onNextEpisode={onNextEpisode}
        hasPrevEpisode={hasPrevEpisode}
        hasNextEpisode={hasNextEpisode}
        onToggleList={onToggleList}
      />
    </div>
  );
}
