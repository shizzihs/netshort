import { get } from './client';

export function getFilmDetail(shortPlayId: string) {
  return get<any>(`/films/detail/${shortPlayId}`);
}

export function getEpisodes(shortPlayId: string) {
  return get<any>(`/films/detail/${shortPlayId}/episodes`);
}

export function getChapterContent(bookId: string, chapterId: string) {
  return get<any>(`/films/detail/${bookId}/chapters/${chapterId}`);
}
