import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../../services/movie.service';
import { Meta, SafeResourceUrl, Title,DomSanitizer } from '@angular/platform-browser';
import { Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-movie-detail',
  imports: [CommonModule],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.css'
})
export class MovieDetail {
 movie: any | null = null
  relatedMovies: any[] = []
  loading = true

  private destroy$ = new Subject<void>()

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => this.movieService.getMovieBySlug(params["id"])),
        takeUntil(this.destroy$),
      )
      .subscribe((movie) => {
        if (movie) {
          this.movie = movie
          this.updateSEO(movie)
          //this.loadRelatedMovies(movie)
          this.loading = false
        } else {
          this.router.navigate(["/"])
        }
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private updateSEO(movie: any): void {
  this.titleService.setTitle(this.movie.title.substring(0, 30));


    this.metaService.updateTag({
      name: "description",
      content: movie.description.substring(0, 160) + "...",
    })

  //   this.metaService.updateTag({
  //     property: "og:title",
  //     content: `${movie.title} (${movie.year})`,
  //   })

  //   this.metaService.updateTag({
  //     property: "og:description",
  //     content: movie.plot.substring(0, 160) + "...",
  //   })

  //   this.metaService.updateTag({
  //     property: "og:image",
  //     content: movie.poster,
  //   })
  // }

  // private loadRelatedMovies(movie: any): void {
  //   this.movieService.getRelatedMovies(movie).subscribe((related) => {
  //     this.relatedMovies = related
  //   })
  }

  getStarArray(rating: number): boolean[] {
    const stars = []
    const fullStars = Math.floor(rating / 2)
    for (let i = 0; i < 5; i++) {
      stars.push(i < fullStars)
    }
    return stars
  }

  getGenreColor(genre: string): string {
    const colors: { [key: string]: string } = {
      Action: "bg-blue-600/20 text-blue-400",
      Crime: "bg-purple-600/20 text-purple-400",
      Drama: "bg-green-600/20 text-green-400",
      Thriller: "bg-red-600/20 text-red-400",
      "Sci-Fi": "bg-cyan-600/20 text-cyan-400",
      Adventure: "bg-orange-600/20 text-orange-400",
    }
    return colors[genre] || "bg-gray-600/20 text-gray-400"
  }

  //   getSafeUrl(url: string): SafeResourceUrl {
  //   return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  // }

  getSafeUrl(): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${this.movie.videoId}?modestbranding=1&rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}