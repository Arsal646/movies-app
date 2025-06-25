

import { Component, inject } from '@angular/core';
import { MovieService } from '../../services/movie.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-movie',
  imports: [],
  templateUrl: './movie.html',
  standalone: true,
  styleUrl: './movie.css',
})
export class Movie {
  protected title = 'movie-blog';
  movieService = inject(MovieService)
  trendingMovies: any[] = [];
  popularMovies: any[] = []
  router = inject(Router)

  constructor() {
    this.movieService.getMovies().subscribe((movies) => {
      console.log(movies);
      // Sort by rating for trending
      this.trendingMovies = [...movies]

      // Sort by year for popular (newer movies)
      this.popularMovies = [...movies]

      // this.loading = false
    })
  }

  onMovieCardClick(movie: any) {
    this.router.navigate([`movie/${movie.videoId}`])
  }
}
