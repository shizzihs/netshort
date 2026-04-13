import { get } from './client';

export function getFilmDetail(shortPlayId: string) {
  return get<any>(`/films/detail/${shortPlayId}`);
}

export function getEpisodes(shortPlayId: string) {
  return get<any>(`/films/detail/${shortPlayId}/episodes`);
}
