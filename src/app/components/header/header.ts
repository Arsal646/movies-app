import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs"
import { MovieService } from "../../services/movie.service"
import { Router, RouterLink } from "@angular/router"
import { FormsModule } from '@angular/forms';
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-header",
  templateUrl: "./header.html",
  styleUrls: ["./header.css"],
  imports:[FormsModule, CommonModule, RouterLink]
})
export class Header implements OnInit, OnDestroy {
  searchQuery = ""
  searchResults: any[] = []
  showSearchResults = false
  isMobileMenuOpen = false
  isMobileSearchOpen = false

  private searchSubject = new Subject<string>()
  private destroy$ = new Subject<void>()

  constructor(
    private movieService: MovieService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((query) => {
      this.performSearch(query)
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement
    this.searchQuery = target.value
    this.searchSubject.next(this.searchQuery)
  }

  performSearch(query: string): void {
    if (query.trim()) {
      this.movieService.searchMovies(query).subscribe((results) => {
        this.searchResults = results.slice(0, 5) // Limit to 5 results
        this.showSearchResults = true
      })
    } else {
      this.searchResults = []
      this.showSearchResults = false
    }
  }

  selectMovie(movie: any): void {
    this.router.navigate(["/movie", movie.slug])
    this.clearSearch()
  }

  clearSearch(): void {
    this.searchQuery = ""
    this.searchResults = []
    this.showSearchResults = false
    this.isMobileSearchOpen = false
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen
    if (this.isMobileSearchOpen) {
      setTimeout(() => {
        const searchInput = document.getElementById("mobile-search-input")
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)
    }
  }

  onSearchBlur(): void {
    // Delay hiding results to allow for click events
    setTimeout(() => {
      this.showSearchResults = false
    }, 200)
  }
}
