import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideAnimations(),
        {
            provide: APP_INITIALIZER,
            useFactory: (authService: AuthService) => () => authService.checkAuth(),
            deps: [AuthService],
            multi: true,
        },
    ],
};
