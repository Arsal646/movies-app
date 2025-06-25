// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';
import { MovieService } from './services/movie.service';
import { inject } from '@angular/core';
import { movies } from './data/movies';

export const serverRoutes: ServerRoute[] = [
  // ── Static (build-time) pages ────────────────────────────
  { path: '',         renderMode: RenderMode.Prerender },   // “/”
  { path: 'movie',    renderMode: RenderMode.Prerender },   // “/movie”

  // ── Dynamic pages ───────────────────────────────────────
  // 1) Option A – on-demand SSR (recommended if you have many IDs)
//   { path: 'movie/:id', renderMode: RenderMode.Server },

  //    ── OR ──
  // 2) Option B – still prerender, but provide the IDs up-front
  {
    path: 'movie/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const ids = await fetchMovieIds();   // return e.g. [{id: 1}, {id: 2}]
      return ids.map(id => ({ id }));
    }
  },

  // ── Fallback ─────────────────────────────────────────────
  { path: '**', renderMode: RenderMode.Server }
];
function fetchMovieIds() {
   return movies.movies.map(ele=>ele.videoId)
}

