import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { type Observable, BehaviorSubject, map, of } from "rxjs"
import { movies } from "../data/movies"

@Injectable({
  providedIn: "root",
})
export class MovieService {
  private moviesSubject = new BehaviorSubject<any[]>([])
  public movies$ = this.moviesSubject.asObservable()

  constructor() {
    this.loadMovies()

    console.log()
  }

    private loadMovies(): void {
      // this.http.get<{ movies: any[] }>("assets/data/movies.json").subscribe((data) => {
      //   console.log(data)
      //   this.moviesSubject.next(data.movies)
      // })
      const data = movies.movies

      this.moviesSubject.next(data);
    }

  getMovies(): Observable<any[]> {
    return this.movies$
  }

  getMovieBySlug(slug: string): Observable<any | undefined> {
    return this.movies$.pipe(map((movies) => movies.find((movie) => movie.slug === slug)))
  }

  searchMovies(query: string): Observable<any[]> {
    return this.movies$.pipe(
      map((movies) => {
        if (!query.trim()) {
          return movies
        }

        const searchTerm = query.toLowerCase()
        return movies.filter(
          (movie) =>
            movie.title.toLowerCase().includes(searchTerm) ||
            movie.genre.some((g:any) => g.toLowerCase().includes(searchTerm)) ||
            movie.director.toLowerCase().includes(searchTerm) ||
            movie.cast.some((c:any) => c.name.toLowerCase().includes(searchTerm)),
        )
      }),
    )
  }

  getRelatedMovies(currentMovie: any): Observable<any[]> {
    return this.movies$.pipe(
      map((movies) => {
        return movies
          .filter(
            (movie) =>
              movie.id !== currentMovie.id &&
              (movie.director === currentMovie.director || movie.genre.some((g:any) => currentMovie.genre.includes(g))),
          )
          .slice(0, 6)
      }),
    )
  }
}
