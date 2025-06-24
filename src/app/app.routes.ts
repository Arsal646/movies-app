import { Routes } from '@angular/router';
import { Movie } from './pages/movie/movie';
import { MovieDetail } from './pages/movie-detail/movie-detail';

export const routes: Routes = [
    {
        path: "",
        component: Movie,
    },
    {
        path: "movie",
        component: Movie,
        pathMatch: 'full'
    },
    {
        path: 'movie/:id',
        component: MovieDetail
    }

];
